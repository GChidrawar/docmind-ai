package com.govind.ai.docmind.service.impl;

import com.govind.ai.docmind.dto.DocumentResponseDto;
import com.govind.ai.docmind.exception.DocumentProcessingException;
import com.govind.ai.docmind.model.DocumentMetadata;
import com.govind.ai.docmind.model.DocumentStatus;
import com.govind.ai.docmind.repository.DocumentMetadataRepo;
import com.govind.ai.docmind.service.DocumentIngestionService;
import com.govind.ai.docmind.service.DocumentMetadataService;
import com.govind.ai.docmind.service.DocumentParserService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * @author govind.chidrawar
 * @since 04-09-2026
 */
@Service
@AllArgsConstructor
@Slf4j
public class DocumentMetadataServiceImpl implements DocumentMetadataService {

    private final DocumentMetadataRepo documentMetadataRepo;
    private final DocumentParserService parserService;
    private final DocumentIngestionService ingestionService;

    @Override
    @Transactional
    public DocumentResponseDto uploadAndProcess(MultipartFile file) {

        if (file.isEmpty()) {
            throw new DocumentProcessingException("Uploaded file is empty");
        }

        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octat-stream";

        // Create document metadata and save
        DocumentMetadata documentMetadata = DocumentMetadata
                .builder()
                .filename(fileName)
                .contentType(contentType)
                .status(DocumentStatus.UPLOADING)
                .fileSize(file.getSize())
                .build();

        documentMetadataRepo.save(documentMetadata);

        try{
            // Parse uploaded file
            List<Document> documents = parserService.parse(file);

            // Chunk, embed and store in vector database
            Integer chunks = ingestionService.ingest(documentMetadata, documents);

            // Mark document as successfully indexed
            markAsIndexed(documentMetadata);

            return buildResponse(documentMetadata);

        } catch (DocumentProcessingException ex) {
            log.warn("Document processing failed [id={}, name={}]", documentMetadata.getId(), fileName, ex);
            markAsFailed(documentMetadata, ex.getMessage());
            return buildResponse(documentMetadata);
        } catch (Exception ex) {
            throw new DocumentProcessingException("Failed to process document: " + fileName, ex);
        }

    }

    /**
     * Build API response.
     */
    private DocumentResponseDto buildResponse(DocumentMetadata metadata) {
        return DocumentResponseDto.builder()
                .id(metadata.getId())
                .fileName(metadata.getFilename())
                .fileSize(metadata.getFileSize())
                .chunksCreated(metadata.getTotalChunks())
                .status(metadata.getStatus())
                .build();
    }

    /**
     * Mark document as successfully indexed.
     */
    private void markAsIndexed(DocumentMetadata metadata) {
        metadata.setStatus(DocumentStatus.INDEXED);
        metadata.setTotalChunks(metadata.getTotalChunks());
        metadata.setErrorMessage(null);
        documentMetadataRepo.save(metadata);
    }

    /**
     * Mark document as failed.
     */
    private void markAsFailed(DocumentMetadata metadata, String errorMessage) {
        metadata.setStatus(DocumentStatus.FAILED);
        metadata.setErrorMessage(errorMessage);
        documentMetadataRepo.save(metadata);
    }

}
