package com.govind.ai.docmind.controller;

import com.govind.ai.docmind.dto.ApiResponse;
import com.govind.ai.docmind.dto.LoginRequest;
import com.govind.ai.docmind.dto.LoginResponse;
import com.govind.ai.docmind.dto.RefreshTokenRequest;
import com.govind.ai.docmind.dto.RegisterUserRequest;
import com.govind.ai.docmind.dto.UserDto;
import com.govind.ai.docmind.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author govind.chidrawar
 * @since 05-10-2026
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "APIs for authenticating users.")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(
            summary = "Login with username and password",
            description = "Authenticates the user and returns a signed JWT bearer token."
    )
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(loginRequest), "Login successful"));
    }

    @Operation(
            summary = "Refresh the access token",
            description = "Exchanges a valid refresh token for a new access token and a new refresh token."
    )
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(@Valid @RequestBody RefreshTokenRequest refreshTokenRequest) {
        return ResponseEntity.ok(ApiResponse.success(authService.refresh(refreshTokenRequest), "Token refreshed"));
    }

    @Operation(
            summary = "Register a new user",
            description = "Creates a new account with the USER role. Username and email must be unique."
    )
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDto>> register(@Valid @RequestBody RegisterUserRequest registerUserRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(authService.register(registerUserRequest), "User registered successfully"));
    }
}
