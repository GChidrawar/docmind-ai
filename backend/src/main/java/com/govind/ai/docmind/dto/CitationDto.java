package com.govind.ai.docmind.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import org.springframework.ai.document.Document;

import java.util.Map;
import java.util.UUID;

/**
 * @author govind.chidrawar
 * @since 11-09-2026
 */
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record CitationDto(
        UUID documentId,
        String fileName,
        Integer chunkIndex,
        Integer pageNumber,
        String snippet,
        Double similarityScore,
        Map<String, Object> metadata
) {

    public static CitationDto from(Document chunk) {
        Map<String, Object> metadata = chunk.getMetadata();

        Double similarityScore = null;
        if(metadata.get("distance") instanceof Number number){
            similarityScore = 1.0 - number.doubleValue();
        }

        return CitationDto.builder()
                .documentId(parseDocumentId(metadata.get("documentId")))
                .fileName((String) metadata.getOrDefault("fileName", "Unknown"))
                .chunkIndex((Integer) metadata.get("chunkIndex"))
                .pageNumber((Integer) metadata.get("pageNumber"))
                .snippet(chunk.getText())
                .similarityScore(similarityScore)
                .metadata(metadata)
                .build();
    }

    private static UUID parseDocumentId(Object rawId) {
        if (rawId == null) {
            return null;
        }
        return rawId instanceof UUID uuid ? uuid : UUID.fromString(rawId.toString());
    }

}
