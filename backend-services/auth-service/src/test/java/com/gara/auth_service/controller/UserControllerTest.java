package com.gara.auth_service.controller;

import com.gara.auth_service.dto.UserDto;
import com.gara.auth_service.service.AuthService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;

public class UserControllerTest {

    @InjectMocks
    private UserController userController;

    @Mock
    private AuthService authService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetCurrentUserSuccess() {
        UserDto mockUser = new UserDto(1L, "testuser", "Test User", "test@example.com", "0123456789", null, "ROLE_CUSTOMER", true);
        Mockito.when(authService.getUserByUsername("testuser")).thenReturn(mockUser);

        ResponseEntity<UserDto> response = userController.getCurrentUser("testuser");

        Assertions.assertEquals(200, response.getStatusCode().value());
        Assertions.assertNotNull(response.getBody());
        Assertions.assertEquals("testuser", response.getBody().getUsername());
        Assertions.assertEquals("ROLE_CUSTOMER", response.getBody().getRole());
    }

    @Test
    public void testGetCurrentUserNotFound() {
        Mockito.when(authService.getUserByUsername("unknown")).thenThrow(new RuntimeException("User not found"));

        ResponseEntity<UserDto> response = userController.getCurrentUser("unknown");

        Assertions.assertEquals(404, response.getStatusCode().value());
    }
}
