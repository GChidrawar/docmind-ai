package com.govind.ai.docmind.controller;

import com.govind.ai.docmind.dto.ApiResponse;
import com.govind.ai.docmind.dto.DocumentResponseDto;
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
@RestController()
@RequestMapping("/api/v1/documents")
@Tag(
        name = "Document Management",
        description = "Endpoints for uploading, listing and managing documents and their vectors embeddings."
)
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentMetadataService documentService;

    @Operation(
            summary = "Upload and index a document(PDF, DOCX, TEXT, MD, CSV)",
            description = "This api is used to upload and index documents files."
    )
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentResponseDto>> uploadDocument(@RequestParam(value = "file") MultipartFile file) {
        DocumentResponseDto documentResponseDto = this.documentService.uploadAndProcess(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(documentResponseDto, "Documents uploaded and indexed successfully"));
    }

}
