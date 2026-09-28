package com.govind.ai.docmind.util;

import com.govind.ai.docmind.dto.DocumentMetadataDto;
import com.govind.ai.docmind.model.DocumentMetadata;

/**
 * @author govind.chidrawar
 * @since 28-09-2026
 */
public class DocumentMetadataUtil {

    public static DocumentMetadataDto toDto(DocumentMetadata documentMetadata) {
        return DocumentMetadataDto.builder()
                .id(documentMetadata.getId())
                .filename(documentMetadata.getFilename())
                .contentType(documentMetadata.getContentType())
                .fileSize(documentMetadata.getFileSize())
                .totalPages(documentMetadata.getTotalPages())
                .totalChunks(documentMetadata.getTotalChunks())
                .status(documentMetadata.getStatus())
                .errorMessage(documentMetadata.getErrorMessage())
                .createdAt(documentMetadata.getCreatedAt())
                .updatedAt(documentMetadata.getUpdatedAt())
                .build();
    }
}
