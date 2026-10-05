package com.govind.ai.docmind.service.impl;

import com.govind.ai.docmind.config.AppProperties;
import com.govind.ai.docmind.exception.DocumentProcessingException;
import com.govind.ai.docmind.model.DocumentMetadata;
import com.govind.ai.docmind.model.DocumentStatus;
import com.govind.ai.docmind.repository.DocumentMetadataRepo;
import com.govind.ai.docmind.service.DocumentIngestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentIngestionServiceImpl implements DocumentIngestionService {

    private final VectorStore vectorStore;
    private final DocumentMetadataRepo documentMetadataRepo;
    private final AppProperties appProperties;


    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Integer ingest(DocumentMetadata metadata, List<Document> parsedDocs) {

        log.info("Starting document ingestion [id={}, name={}, pages={}]", metadata.getId(), metadata.getFilename(), parsedDocs.size());

        try {
            // 1. Mark document as processing
            markAsProcessing(metadata, parsedDocs.size());

            // 2. Split parsed documents into smaller chunks
            List<Document> chunks = splitIntoChunks(cleanText(parsedDocs));

            if (chunks.isEmpty()) {
                return 0;
            }

            log.info("Created {} chunks for document [id={}, name={}]", chunks.size(), metadata.getId(), metadata.getFilename());

            // 3. Add document metadata to every chunk
            List<Document> enrichedChunks = enrichChunks(chunks, metadata);

            // 4. Store chunks in vector store
            storeChunks(enrichedChunks, metadata);
            metadata.setTotalChunks(enrichedChunks.size());
            documentMetadataRepo.save(metadata);

            log.info("Successfully indexed document [id={}, name={}, pages={}, chunks={}]", metadata.getId(), metadata.getFilename(), metadata.getTotalPages(), enrichedChunks.size());
            return enrichedChunks.size();

        } catch (Exception ex) {
            log.error("Failed to ingest document [id={}, name={}]", metadata.getId(), metadata.getFilename(), ex);
            throw new DocumentProcessingException(ex.getMessage(), ex);
        }
    }


    private List<Document> cleanText(List<Document> docs) {
        return docs.stream()
                .map(doc -> doc.mutate().text(normalizeWhitespace(doc.getText())).build())
                .toList();
    }

    private String normalizeWhitespace(String text) {
        return text
                .replaceAll("[ \\t\\u00A0]+", " ")
                .replaceAll(" ?\\n ?", "\n")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();
    }

    /**
     * Split parsed documents into smaller chunks.
     */
    private List<Document> splitIntoChunks(List<Document> parsedDocs) {

        TokenTextSplitter splitter = TokenTextSplitter
                .builder()
                .withChunkSize(appProperties.getRag().getChunkSize())
                .withMinChunkSizeChars(appProperties.getRag().getMinChunkSizeChars())
                .withMinChunkLengthToEmbed(appProperties.getRag().getMinChunkLengthToEmbed())
                .withMaxNumChunks(appProperties.getRag().getMaxNumChunks())
                .withKeepSeparator(true).build();

        return splitter.apply(parsedDocs);
    }

    /**
     * Add useful metadata to every document chunk.
     */
    private List<Document> enrichChunks(List<Document> chunks, DocumentMetadata metadata) {

        List<Document> enrichedChunks = new ArrayList<>(chunks.size());

        for (int index = 0; index < chunks.size(); index++) {
            Document chunk = chunks.get(index);

            Map<String, Object> enrichedMetadata = new HashMap<>(chunk.getMetadata());
            enrichedMetadata.remove("chunk_index");
            enrichedMetadata.remove("total_chunks");

            enrichedMetadata.put("documentId", metadata.getId().toString());
            enrichedMetadata.put("userId", metadata.getUser().getId().toString());
            enrichedMetadata.put("fileName", metadata.getFilename());
            enrichedMetadata.put("contentType", metadata.getContentType());
            enrichedMetadata.put("chunkIndex", index);
            enrichedMetadata.put("totalChunks", chunks.size());
            addPageNumber(enrichedMetadata, chunk);

            Document enrichedDocument = new Document(chunk.getText(), enrichedMetadata);
            enrichedChunks.add(enrichedDocument);
        }

        return enrichedChunks;
    }

    /**
     * Preserve page number information if available.
     */
    private void addPageNumber(Map<String, Object> metadata, Document chunk) {

        Object pageNumber = chunk.getMetadata().get("page_number");

        if (pageNumber == null) {
            pageNumber = chunk.getMetadata().get("pageNumber");
        }

        if (pageNumber != null) {
            metadata.put("pageNumber", pageNumber);
            metadata.remove("page_number");
        }
    }

    /**
     * Store chunks in the configured vector store.
     * <p>
     * The configured embedding model is used by the VectorStore
     * to create embeddings before persisting the vectors.
     */
    private void storeChunks(List<Document> chunks, DocumentMetadata metadata) {
        log.info("Writing {} chunks to vector store [documentId={}, name={}]", chunks.size(), metadata.getId(), metadata.getFilename());
        vectorStore.add(chunks);
    }

    /**
     * Mark document as currently being processed.
     */
    private void markAsProcessing(DocumentMetadata metadata, int totalPages) {
        metadata.setStatus(DocumentStatus.PROCESSING);
        metadata.setTotalPages(totalPages);
        documentMetadataRepo.save(metadata);
    }


    @Override
    public void deleteDocumentVectors(String documentId) {
        if(StringUtils.isEmpty(documentId)) return;

        log.info("Deleting vector chunks [documentId={}]", documentId);
        vectorStore.delete("documentId == '" + documentId + "'");
        log.info("Vector chunks deleted successfully [documentId={}]", documentId);
    }

    @Override
    public void deleteAllDocumentVectors(List<UUID> documentIds) {
        if (documentIds == null || documentIds.isEmpty()) {
            return;
        }

        String filterExpression = documentIds.stream()
                .map(id -> "documentId == '" + id + "'")
                .collect(Collectors.joining(" OR "));

        vectorStore.delete(filterExpression);
        log.info("Vector chunks deleted successfully [document count= {}]", documentIds.size());
    }
}