package com.govind.ai.docmind.dto;

import com.govind.ai.docmind.constants.Role;
import com.govind.ai.docmind.model.User;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * @author govind.chidrawar
 * @since 05-10-2026
 */
@Builder
public record UserDto(Long id, String userName, Role role, String email, LocalDateTime createdAt) {

    public static UserDto from(User user) {
        return UserDto.builder()
                .id(user.getId())
                .userName(user.getUserName())
                .role(user.getRole())
                .email(user.getEmail())
                .createdAt(user.getCreateAt())
                .build();
    }
}
