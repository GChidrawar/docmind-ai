package com.govind.ai.docmind.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

import java.util.List;

/**
 * Response returned to the client after processing a chat/RAG query,
 * including the generated answer and any supporting document citation
 *
 * @author govind.chidrawar
 * @since 07-09-2026
 */
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ChatResponseDto(
        String answer,
        String conversationId,
        List<CitationDto> citations,
        Long responseTimeMs
) {
}
