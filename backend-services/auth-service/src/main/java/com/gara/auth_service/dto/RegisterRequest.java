package com.gara.auth_service.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String fullName;
    private String roleName; // Truyền vào ADMIN, MANAGER, MECHANIC...
}
