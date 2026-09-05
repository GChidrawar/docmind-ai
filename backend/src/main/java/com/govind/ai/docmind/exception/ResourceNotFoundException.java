package com.govind.ai.docmind.exception;

import java.io.Serial;

/**
 * Exception thrown when a requested resource cannot be found.
 *
 * @author govind.chidrawar
 * @since 05-09-2026
 */
public class ResourceNotFoundException extends RuntimeException {

    @Serial
    private static final long serialVersionUID = 1L;

    public ResourceNotFoundException() {
        super("Requested resource was not found.");
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
