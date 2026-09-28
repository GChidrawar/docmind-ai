package com.govind.ai.docmind.dto;

import com.govind.ai.docmind.model.DocumentStatus;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * @author govind.chidrawar
 * @since 28-09-2026
 */

@Builder
public record DocumentMetadataDto(
        UUID id,
        String filename,
        String contentType,
        Long fileSize,
        Integer totalPages,
        Integer totalChunks,
        DocumentStatus status,
        String errorMessage,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {


}
