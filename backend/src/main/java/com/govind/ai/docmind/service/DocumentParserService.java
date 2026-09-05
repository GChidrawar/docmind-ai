package com.govind.ai.docmind.service;

import com.govind.ai.docmind.exception.DocumentProcessingException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.reader.pdf.config.PdfDocumentReaderConfig;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * Parses uploaded documents into a list of {@link Document} chunks.
 * Routes PDF files to a page-based reader and all other formats
 * to a generic Tika-based reader.
 *
 * @author govind.chidrawar
 * @since 04-09-2026
 */
@Service
@Slf4j
public class DocumentParserService {

    public List<Document> parse(MultipartFile file) {

        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "N/A";

        log.info("Parsing file: {}, size: {} bytes, contentType: {}", fileName, file.getSize(), contentType);

        try {
            // convert file into the spring resource
            Resource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return fileName;
                }
            };

            List<Document> documents;
            if (fileName.toLowerCase().endsWith(".pdf") || contentType.contains("pdf")) {
                documents = parsePdf(resource);
            } else {
                documents = parseGenericFile(resource);
            }

            log.info("Parsed file: {}, documents/pages extracted: {}", fileName, documents.size());
            return documents;

        } catch (IOException e) {
            log.error("Failed to read file bytes {}", fileName, e);
            throw new DocumentProcessingException("Could not read uploaded file : " + fileName, e);
        } catch (Exception e) {
            log.error("Error during document parsing: {}", fileName, e);
            throw new DocumentProcessingException("Failed to parse document content: " + fileName, e);
        }

    }

    // Parses PDF page-by-page, no header/footer margin trimming
    private List<Document> parsePdf(Resource resource) {
        PdfDocumentReaderConfig config = PdfDocumentReaderConfig
                .builder()
                .withPageBottomMargin(0)
                .withPageTopMargin(0)
                .withPagesPerDocument(1)
                .build();

        PagePdfDocumentReader documentReader = new PagePdfDocumentReader(resource, config);
        return documentReader.read();
    }

    // parser for non-PDF formats (docx, txt, etc.) via Tika
    private List<Document> parseGenericFile(Resource resource) {
        TikaDocumentReader tikaDocumentReader = new TikaDocumentReader(resource);
        return tikaDocumentReader.read();
    }
}
