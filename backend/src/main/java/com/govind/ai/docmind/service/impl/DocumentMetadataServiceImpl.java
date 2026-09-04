package com.govind.ai.docmind.service.impl;

import com.govind.ai.docmind.dto.DocumentResponseDto;
import com.govind.ai.docmind.model.DocumentMetadata;
import com.govind.ai.docmind.model.DocumentStatus;
import com.govind.ai.docmind.repository.DocumentMetadataRepo;
import com.govind.ai.docmind.service.DocumentMetadataService;
import com.govind.ai.docmind.service.DocumentParserService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.ai.document.Document;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

/**
 * @author govind.chidrawar
 * @since 04-09-2026
 */
@Service
@AllArgsConstructor
@Slf4j
public class DocumentMetadataServiceImpl implements DocumentMetadataService {

    private final DocumentMetadataRepo documentMetadataRepo;
    private final DocumentParserService documentParserService;

    @Override
    public DocumentResponseDto uploadAndProcess(MultipartFile file) {

        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";

        // Create and Save document metadata
        DocumentMetadata documentMetadata = DocumentMetadata.builder().filename(fileName).contentType(contentType).status(DocumentStatus.UPLOADING).fileSize(file.getSize()).build();
        documentMetadata = documentMetadataRepo.save(documentMetadata);

        try{
            List<Document> documents = documentParserService.parse(file);

        } catch (Exception e) {

        }
        return null;
    }
}
