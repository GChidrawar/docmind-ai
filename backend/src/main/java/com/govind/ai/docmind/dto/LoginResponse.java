package com.govind.ai.docmind.dto;

/**
 * @author govind.chidrawar
 * @since 05-10-2026
 */
public record LoginResponse(String token, String refreshToken, String tokenType, UserDto user) {
}
