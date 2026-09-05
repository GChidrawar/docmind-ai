package com.govind.ai.docmind.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.govind.ai.docmind.model.DocumentStatus;
import lombok.*;

import java.util.UUID;

/**
 * @author govind.chidrawar
 * @since 04-09-2026
 */
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DocumentResponseDto {
    private UUID id;
    private String fileName;
    private Long fileSize;
    private DocumentStatus status;
    private Integer chunksCreated;
    private String message;
}