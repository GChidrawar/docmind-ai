package com.govind.ai.docmind.service.impl;

import com.govind.ai.docmind.constants.Role;
import com.govind.ai.docmind.dto.LoginRequest;
import com.govind.ai.docmind.dto.LoginResponse;
import com.govind.ai.docmind.dto.RefreshTokenRequest;
import com.govind.ai.docmind.dto.RegisterUserRequest;
import com.govind.ai.docmind.dto.UserDto;
import com.govind.ai.docmind.exception.DuplicateResourceException;
import com.govind.ai.docmind.model.User;
import com.govind.ai.docmind.repository.UserRepository;
import com.govind.ai.docmind.security.CustomUserDetail;
import com.govind.ai.docmind.security.CustomUserDetailService;
import com.govind.ai.docmind.security.JwtService;
import com.govind.ai.docmind.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import io.jsonwebtoken.JwtException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author govind.chidrawar
 * @since 05-10-2026
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;

    private final JwtService jwtService;

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    private final CustomUserDetailService userDetailService;

    @Override
    public LoginResponse login(LoginRequest loginRequest) {

        // Throws BadCredentialsException for an unknown user or wrong password
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.userName(), loginRequest.password()));

        CustomUserDetail userDetail = (CustomUserDetail) authentication.getPrincipal();
        log.info("User '{}' logged in successfully", userDetail.getUsername());

        return buildLoginResponse(userDetail);
    }

    @Override
    public LoginResponse refresh(RefreshTokenRequest refreshTokenRequest) {

        // A malformed, tampered or expired token surfaces as a 401 rather than a 500
        CustomUserDetail userDetail;
        try {
            String username = jwtService.extractUsername(refreshTokenRequest.refreshToken());
            userDetail = (CustomUserDetail) userDetailService.loadUserByUsername(username);
            if (!jwtService.isRefreshTokenValid(refreshTokenRequest.refreshToken(), userDetail)) {
                throw new BadCredentialsException("Invalid refresh token");
            }
        } catch (JwtException | IllegalArgumentException ex) {
            throw new BadCredentialsException("Invalid refresh token", ex);
        }

        log.info("Token refreshed for user '{}'", userDetail.getUsername());
        return buildLoginResponse(userDetail);
    }

    private LoginResponse buildLoginResponse(CustomUserDetail userDetail) {
        return new LoginResponse(
                jwtService.generateToken(userDetail),
                jwtService.generateRefreshToken(userDetail),
                "Bearer",
                UserDto.from(userDetail.getUser()));
    }

    @Override
    @Transactional
    public UserDto register(RegisterUserRequest registerUserRequest) {

        if (userRepository.existsByUserName(registerUserRequest.userName())) {
            throw new DuplicateResourceException("Username is already taken");
        }
        if (userRepository.existsByEmail(registerUserRequest.email())) {
            throw new DuplicateResourceException("Email is already registered");
        }

        // Role is never taken from the request, so self-registration can only create USER accounts
        User user = User.builder()
                .userName(registerUserRequest.userName())
                .email(registerUserRequest.email())
                .password(passwordEncoder.encode(registerUserRequest.password()))
                .role(Role.USER)
                .build();

        User saved = userRepository.save(user);
        log.info("User '{}' registered successfully", saved.getUserName());
        return UserDto.from(saved);
    }
}
