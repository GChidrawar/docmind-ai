package com.govind.ai.docmind.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

import java.util.UUID;

/**
 * @author govind.chidrawar
 * @since 19-10-2026
 */
@Builder
public record SearchRequestDto(
        @NotBlank(message = "Query cannot be empty")
        String query,
        UUID documentId,
        Integer topK,
        Double similaritySearch
){

}
