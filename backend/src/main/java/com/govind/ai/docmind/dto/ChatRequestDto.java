package com.govind.ai.docmind.dto;

import jakarta.validation.constraints.*;

import java.util.UUID;

/**
 * Request DTO for submitting a question to the document chat service.
 *
 * @author govind.chidrawar
 * @since 07-09-2026
 */
public record ChatRequestDto(
        @NotBlank(message = "Question can not be empty")
        String question,
        UUID documentId,
        @Min(value = 1, message = "topK must be greater than 0") @Max(value = 100, message = "topK must not exceed 100")
        Integer topK,
        @DecimalMin(value = "0.0", message = "minSimilarity must be at least 0.0")
        @DecimalMax(value = "1.0", message = "minSimilarity must not exceed 1.0")
        Double minSimilarity,
        String conversationId
) {

}

