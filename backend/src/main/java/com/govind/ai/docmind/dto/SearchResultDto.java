package com.govind.ai.docmind.dto;

import lombok.Builder;

import java.util.List;

/**
 * @author govind.chidrawar
 * @since 19-10-2026
 */
@Builder
public record SearchResultDto(
        String query,
        int totalMatches,
        List<CitationDto> matches
) {

}
