package com.govind.ai.docmind.controller;

import com.govind.ai.docmind.dto.ApiResponse;
import com.govind.ai.docmind.dto.DocumentMetadataDto;
import com.govind.ai.docmind.dto.DocumentResponseDto;
import com.govind.ai.docmind.model.DocumentStatus;
import com.govind.ai.docmind.service.DocumentMetadataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

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

    @Operation( summary = "This api is used to get an uploaded document metadata by its id")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentMetadataDto>> getDocument( @Valid @NotEmpty(message = "Document Id can't be null or empty") String documentId) {
        DocumentMetadataDto documentMetadataDto = documentService.findDocumentById(documentId);
        return ResponseEntity.ok(ApiResponse.success(documentMetadataDto));
    }

    @GetMapping
    @Operation( summary = "This api is used to get all uploaded documents metadata")
    public ResponseEntity<ApiResponse<List<DocumentMetadataDto>>> getAllDocuments() {
        List<DocumentMetadataDto> documentMetadataDtoList = documentService.findAllDocuments();
        return ResponseEntity.ok(ApiResponse.success(documentMetadataDtoList));
    }

    @DeleteMapping("/{id}")
    @Operation( summary = "This api is used to delete an uploaded document and their vectors by its id")
    public ResponseEntity<ApiResponse<?>> deleteDocumentById(String documentId) {
        documentService.deleteDocumentById(documentId);
        return ResponseEntity.ok(ApiResponse.success(null, "Document and their vectors deleted successfully"));
    }

    @DeleteMapping
    @Operation( summary = "This api is used to delete all the uploaded documents and their vectors")
    public ResponseEntity<ApiResponse<?>> deleteAllDocuments() {
        documentService.deleteAllDocuments();
        return ResponseEntity.ok(ApiResponse.success(null, "All documents and their vectors deleted successfully"));
    }
}
