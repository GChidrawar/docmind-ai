package com.govind.ai.docmind.service;

import com.govind.ai.docmind.dto.DocumentMetadataDto;
import com.govind.ai.docmind.dto.DocumentResponseDto;
import com.govind.ai.docmind.model.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 *
 * @author govind.chidrawar
 * @since 04-09-2026
 */
public interface DocumentMetadataService {

    DocumentResponseDto uploadAndProcess(MultipartFile file, User user);

    /** Returns the user's own document; an admin may read any document. */
    DocumentMetadataDto findDocumentById(String documentId, User user);

    /** Documents owned by the given user. */
    List<DocumentMetadataDto> findAllDocuments(User user);

    /** Documents of every user; for admin endpoints only. */
    List<DocumentMetadataDto> findAllDocumentsOfAllUsers();

    /** Deletes the user's own document; an admin may delete any document. */
    void deleteDocumentById(String documentId, User user);

    /** Deletes only the given user's documents. */
    void deleteAllDocuments(User user);
}
