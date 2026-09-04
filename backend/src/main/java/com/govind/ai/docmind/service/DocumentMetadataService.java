package com.govind.ai.docmind.service;

import com.govind.ai.docmind.dto.DocumentResponseDto;
import org.springframework.web.multipart.MultipartFile;

/**
 *
 * @author govind.chidrawar
 * @since 04-09-2026
 */
public interface DocumentMetadataService {

    DocumentResponseDto uploadAndProcess(MultipartFile file);
}
