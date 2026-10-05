package com.govind.ai.docmind.controller;

import com.govind.ai.docmind.dto.ApiResponse;
import com.govind.ai.docmind.dto.DocumentMetadataDto;
import com.govind.ai.docmind.dto.DocumentResponseDto;
import com.govind.ai.docmind.model.DocumentStatus;
import com.govind.ai.docmind.model.User;
import com.govind.ai.docmind.service.DocumentMetadataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotEmpty;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

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
@Validated
public class DocumentController {

    private final DocumentMetadataService documentService;

    @Operation(summary = "Upload and index a document (PDF and other formats via Apache Tika)")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentResponseDto>> uploadDocument(@RequestParam(value = "file") MultipartFile file, @AuthenticationPrincipal User user) {
        DocumentResponseDto documentResponseDto = this.documentService.uploadAndProcess(file, user);
        if(documentResponseDto.getStatus() == DocumentStatus.INDEXED) {
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(documentResponseDto, "Document uploaded and indexed successfully"));
        } else {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT).body(ApiResponse.error(documentResponseDto, "Document upload failed"));
        }
    }

    @Operation( summary = "This api is used to get an uploaded document metadata by its id")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentMetadataDto>> getDocument(@PathVariable("id") @NotEmpty(message = "Document Id can't be null or empty") String documentId, @AuthenticationPrincipal User user) {
        DocumentMetadataDto documentMetadataDto = documentService.findDocumentById(documentId, user);
        return ResponseEntity.ok(ApiResponse.success(documentMetadataDto));
    }

    @GetMapping
    @Operation( summary = "This api is used to get the current user's uploaded documents metadata")
    public ResponseEntity<ApiResponse<List<DocumentMetadataDto>>> getAllDocuments(@AuthenticationPrincipal User user) {
        List<DocumentMetadataDto> documentMetadataDtoList = documentService.findAllDocuments(user);
        return ResponseEntity.ok(ApiResponse.success(documentMetadataDtoList));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation( summary = "Admin only: get the metadata of every user's uploaded documents")
    public ResponseEntity<ApiResponse<List<DocumentMetadataDto>>> getAllUsersDocuments() {
        return ResponseEntity.ok(ApiResponse.success(documentService.findAllDocumentsOfAllUsers()));
    }

    @DeleteMapping("/{id}")
    @Operation( summary = "This api is used to delete an uploaded document and their vectors by its id")
    public ResponseEntity<ApiResponse<?>> deleteDocumentById(@PathVariable("id") String documentId, @AuthenticationPrincipal User user) {
        documentService.deleteDocumentById(documentId, user);
        return ResponseEntity.ok(ApiResponse.success(null, "Document and their vectors deleted successfully"));
    }

    @DeleteMapping
    @Operation( summary = "This api is used to delete all the current user's uploaded documents and their vectors")
    public ResponseEntity<ApiResponse<?>> deleteAllDocuments(@AuthenticationPrincipal User user) {
        documentService.deleteAllDocuments(user);
        return ResponseEntity.ok(ApiResponse.success(null, "All documents and their vectors deleted successfully"));
    }
}
