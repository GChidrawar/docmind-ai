package com.govind.ai.docmind.service;

import com.govind.ai.docmind.model.DocumentMetadata;
import org.springframework.ai.document.Document;

import java.util.List;

/**
 * @author govind.chidrawar
 * @since 05-09-2026
 */
public interface DocumentIngestionService {

    Integer ingest(DocumentMetadata metadata, List<Document> parsedDocs);

}
