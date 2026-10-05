package com.govind.ai.docmind.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * @author govind.chidrawar
 * @since 05-10-2026
 */
public record RegisterUserRequest(
        @NotBlank(message = "userName is required")
        @Size(min = 3, max = 50, message = "userName must be between 3 and 50 characters")
        String userName,

        @NotBlank(message = "email is required")
        @Email(message = "email must be valid")
        String email,

        @NotBlank(message = "password is required")
        @Size(min = 8, max = 12, message = "password must be between 8 and 12 characters")
        String password) {
}
