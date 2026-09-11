package com.govind.ai.docmind.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * Generic wrapper for all API responses.
 * Ensures a consistent success/error response shape across endpoints.
 *
 * @param <T> type of the payload returned in {@code data}
 *
 * @author govind.chidrawar
 * @since 04-09-2026
 */

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(Boolean success, String message, T data, LocalDateTime timestamp) {

    // Compact constructor: default timestamp to now() if not explicitly set via builder
    public ApiResponse {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }


    /**
     * Builds a success response with data only.
     */
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder().success(true).data(data).build();
    }

    /**
     * Builds a success response with data and a custom message.
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder().success(true).message(message).data(data).build();
    }

    /**
     * Builds an error response with a message only (no data).
     */
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder().success(false).message(message).build();
    }

    /**
     * Builds an error response with a message and data
     */
    public static <T> ApiResponse<T> error(T data, String message) {
        return ApiResponse.<T>builder().success(false).message(message).data(data).build();
    }
}
