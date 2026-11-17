
package com.controlator.painel.dto;

import com.controlator.painel.enums.Role;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String username,
        String email,
        Role role,
        boolean active,
        LocalDateTime createdAt
) {
}
