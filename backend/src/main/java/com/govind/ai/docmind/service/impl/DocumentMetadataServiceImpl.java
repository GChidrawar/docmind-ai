package com.govind.ai.docmind.service.impl;

import com.govind.ai.docmind.constants.Role;
import com.govind.ai.docmind.dto.DocumentMetadataDto;
import com.govind.ai.docmind.dto.DocumentResponseDto;
import com.govind.ai.docmind.exception.DocumentProcessingException;
import com.govind.ai.docmind.exception.ResourceNotFoundException;
import com.govind.ai.docmind.model.DocumentMetadata;
import com.govind.ai.docmind.model.DocumentStatus;
import com.govind.ai.docmind.model.User;
import com.govind.ai.docmind.repository.DocumentMetadataRepo;
import com.govind.ai.docmind.service.DocumentIngestionService;
import com.govind.ai.docmind.service.DocumentMetadataService;
import com.govind.ai.docmind.service.DocumentParserService;
import com.govind.ai.docmind.util.DocumentMetadataUtil;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
    private final ModelMapper modelMapper;


    @Override
    public DocumentResponseDto uploadAndProcess(MultipartFile file, User user) {

        if (file.isEmpty()) {
            throw new DocumentProcessingException("Uploaded file is empty");
        }

        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

        // Create document metadata and save
        DocumentMetadata documentMetadata = DocumentMetadata
                .builder()
                .filename(fileName)
                .contentType(contentType)
                .status(DocumentStatus.UPLOADING)
                .fileSize(file.getSize())
                .user(user)
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

    @Override
    public DocumentMetadataDto findDocumentById(String documentId, User user) {
        log.info("Finding document with id={}", documentId);
        return DocumentMetadataUtil.toDto(findAccessibleDocument(documentId, user));
    }

    @Override
    public List<DocumentMetadataDto> findAllDocuments(User user) {
        return documentMetadataRepo.findAllByUserIdOrderByCreatedAtDesc(user.getId()).stream().map(DocumentMetadataUtil::toDto).toList();
    }

    @Override
    public List<DocumentMetadataDto> findAllDocumentsOfAllUsers() {
        return documentMetadataRepo.findAllByOrderByCreatedAtDesc().stream().map(DocumentMetadataUtil::toDto).toList();
    }

    @Override
    @Transactional
    public void deleteDocumentById(String documentId, User user) {
        DocumentMetadata documentMetadata = findAccessibleDocument(documentId, user);

        log.info("Deleting document with id: {} and their vectors", documentId);

        ingestionService.deleteDocumentVectors(documentId);
        documentMetadataRepo.delete(documentMetadata);

        log.info("Successfully deleted document with id: {} and their vectors", documentId);
    }

    @Override
    @Transactional
    public void deleteAllDocuments(User user) {
        // Only the caller's own documents are removed, never other users' documents
        Long userId = user.getId();
        List<UUID> documentIds = documentMetadataRepo.findIdsByUserId(userId);

        if (documentIds.isEmpty()) {
            log.info("No documents found for deletion");
            return;
        }

        log.info("Deleting {} documents and their vectors", documentIds.size());

        ingestionService.deleteAllDocumentVectors(documentIds);
        documentMetadataRepo.deleteAllByUserId(userId);
        log.info("Successfully deleted {} documents and their vectors", documentIds.size());
    }

    /**
     * Loads a document the caller may access: their own, or any document for an admin.
     * A document owned by someone else is reported as not found
     */
    private DocumentMetadata findAccessibleDocument(String documentId, User user) {
        UUID id = UUID.fromString(documentId);
        Optional<DocumentMetadata> document = user.getRole() == Role.ADMIN
                ? documentMetadataRepo.findById(id)
                : documentMetadataRepo.findByIdAndUserId(id, user.getId());
        return document.orElseThrow(() -> new ResourceNotFoundException("Document with id: " + documentId + " not found"));
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
