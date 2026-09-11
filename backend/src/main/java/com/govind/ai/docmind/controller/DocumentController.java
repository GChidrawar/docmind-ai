package com.govind.ai.docmind.controller;

import com.govind.ai.docmind.dto.ApiResponse;
import com.govind.ai.docmind.dto.DocumentResponseDto;
import com.govind.ai.docmind.model.DocumentStatus;
import com.govind.ai.docmind.service.DocumentMetadataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author govind.chidrawar
 * @since 04-09-2026
 */
@RestController
@RequestMapping("/api/v1/documents")
@Tag(
        name = "Document Management",
        description = "APIs for uploading, listing, managing documents, and their vector embeddings."
)
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentMetadataService documentService;

    @Operation(
            summary = "Upload and index a document(PDF and other common document formats via Apache Tika) ",
            description = "This api is used to upload and index documents files.",
            responses = {
                    @io.swagger.v3.oas.annotations.responses.ApiResponse(
                            responseCode = "201",
                            description = "Document uploaded and indexed successfully"
                    ),
                    @io.swagger.v3.oas.annotations.responses.ApiResponse(
                            responseCode = "422",
                            description = "Invalid or empty file"
                    ),
                    @io.swagger.v3.oas.annotations.responses.ApiResponse(
                            responseCode = "500",
                            description = "Unexpected error occurred during document processing"
                    )
            }
    )
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentResponseDto>> uploadDocument(@RequestParam(value = "file") MultipartFile file) {
        DocumentResponseDto documentResponseDto = this.documentService.uploadAndProcess(file);
        if(documentResponseDto.getStatus() == DocumentStatus.INDEXED) {
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(documentResponseDto, "Document uploaded and indexed successfully"));
        } else {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT).body(ApiResponse.error(documentResponseDto, "Document upload failed"));
        }
    }
}
