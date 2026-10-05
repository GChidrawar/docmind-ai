package com.govind.ai.docmind.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * @author govind.chidrawar
 * @since 05-10-2026
 */
public record LoginRequest(
        @NotBlank(message = "userName is required") String userName,
        @NotBlank(message = "password is required") String password) {
}
