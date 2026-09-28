package com.govind.ai.docmind.service;

import com.govind.ai.docmind.dto.DocumentMetadataDto;
import com.govind.ai.docmind.dto.DocumentResponseDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 *
 * @author govind.chidrawar
 * @since 04-09-2026
 */
public interface DocumentMetadataService {

    DocumentResponseDto uploadAndProcess(MultipartFile file);

    DocumentMetadataDto findDocumentById(String documentId);

    List<DocumentMetadataDto> findAllDocuments();

    void deleteDocumentById(String documentId);

    void deleteAllDocuments();
}
