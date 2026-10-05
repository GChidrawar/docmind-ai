package com.govind.ai.docmind.service;

import com.govind.ai.docmind.dto.LoginRequest;
import com.govind.ai.docmind.dto.LoginResponse;
import com.govind.ai.docmind.dto.RefreshTokenRequest;
import com.govind.ai.docmind.dto.RegisterUserRequest;
import com.govind.ai.docmind.dto.UserDto;

/**
 * @author govind.chidrawar
 * @since 05-10-2026
 */
public interface AuthService {

    LoginResponse login(LoginRequest loginRequest);

    LoginResponse refresh(RefreshTokenRequest refreshTokenRequest);

    UserDto register(RegisterUserRequest registerUserRequest);
}
