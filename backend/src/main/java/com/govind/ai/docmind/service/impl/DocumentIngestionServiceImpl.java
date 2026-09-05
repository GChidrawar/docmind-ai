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
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentIngestionServiceImpl implements DocumentIngestionService {

    private final VectorStore vectorStore;
    private final DocumentMetadataRepo documentMetadataRepo;
    private final AppProperties appProperties;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Integer ingest(DocumentMetadata metadata, List<Document> parsedDocs) {

        log.info("Starting document ingestion [id={}, name={}, pages={}]", metadata.getId(), metadata.getFilename(), parsedDocs.size());

        try {
            // 1. Mark document as processing
            markAsProcessing(metadata, parsedDocs.size());

            // 2. Split parsed documents into smaller chunks
            List<Document> chunks = splitIntoChunks(parsedDocs);

            if (chunks.isEmpty()) {
                return 0;
            }

            log.info("Created {} chunks for document [id={}, name={}]", chunks.size(), metadata.getId(), metadata.getFilename());

            // 3. Add document metadata to every chunk
            List<Document> enrichedChunks = enrichChunks(chunks, metadata);

            // 4. Store chunks in vector store
            storeChunks(enrichedChunks, metadata);
            metadata.setTotalChunks(enrichedChunks.size());

            log.info("Successfully indexed document [id={}, name={}, pages={}, chunks={}]", metadata.getId(), metadata.getFilename(), metadata.getTotalPages(), enrichedChunks.size());
            return enrichedChunks.size();

        } catch (Exception ex) {
            log.error("Failed to ingest document [id={}, name={}]", metadata.getId(), metadata.getFilename(), ex);
            throw new DocumentProcessingException(ex.getMessage());
        }
    }

    /**
     * Mark document as currently being processed.
     */
    private void markAsProcessing(DocumentMetadata metadata, int totalPages) {
        metadata.setStatus(DocumentStatus.PROCESSING);
        metadata.setTotalPages(totalPages);
        documentMetadataRepo.save(metadata);
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
            enrichedMetadata.put("documentId", metadata.getId().toString());
            enrichedMetadata.put("fileName", metadata.getFilename());
            enrichedMetadata.put("contentType", metadata.getContentType());
            enrichedMetadata.put("chunkIndex", index);

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


    public void deleteDocumentVectors(String documentId) {
        log.info("Deleting vector chunks [documentId={}]", documentId);
        vectorStore.delete("documentId == '" + documentId + "'");
        log.info("Vector chunks deleted [documentId={}]", documentId);
    }
}