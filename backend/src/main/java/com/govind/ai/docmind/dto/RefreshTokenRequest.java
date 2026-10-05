package com.govind.ai.docmind.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * @author govind.chidrawar
 * @since 05-10-2026
 */
public record RefreshTokenRequest(@NotBlank(message = "refreshToken is required") String refreshToken) {
}
