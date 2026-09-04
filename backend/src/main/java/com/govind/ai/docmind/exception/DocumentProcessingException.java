package com.govind.ai.docmind.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a document fails to be read, parsed, or processed
 * (e.g. corrupt file, unsupported format, or unexpected parsing error).
 * <p>
 * Annotated with {@link ResponseStatus} so that, if left unhandled by a
 * dedicated {@code @ExceptionHandler}, Spring returns HTTP 422 automatically.
 *
 * @author govind.chidrawar
 * @since 04-09-2026
 */
@ResponseStatus(HttpStatus.UNPROCESSABLE_CONTENT)
public class DocumentProcessingException extends RuntimeException {

    public DocumentProcessingException() {
        super("Error in processing document.");
    }

    public DocumentProcessingException(String message) {
        super(message);
    }

    public DocumentProcessingException(String message, Throwable cause) {
        super(message, cause);
    }
}
