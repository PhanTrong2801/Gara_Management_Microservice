package com.gara.auth_service.controller;

import com.gara.auth_service.dto.UserDto;
import com.gara.auth_service.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth/users")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id, @RequestBody UserDto request) {
        try {
            return ResponseEntity.ok(authService.updateUser(id, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
