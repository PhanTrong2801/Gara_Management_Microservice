package com.gara.auth_service.service;

import com.gara.auth_service.dto.AuthRequest;
import com.gara.auth_service.dto.AuthResponse;
import com.gara.auth_service.dto.RegisterRequest;
import com.gara.auth_service.entity.Role;
import com.gara.auth_service.entity.User;
import com.gara.auth_service.repository.RoleRepository;
import com.gara.auth_service.repository.UserRepository;
import com.gara.auth_service.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // Logic Đăng nhập
    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Sai mật khẩu");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().getName());
        return new AuthResponse(token, user.getUsername(), user.getRole().getName());
    }

    // Logic Đăng ký
    public String register(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Tên đăng nhập đã tồn tại");
        }

        Role role = roleRepository.findByName(request.getRoleName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Role: " + request.getRoleName()));

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // Mã hóa mật khẩu trước khi lưu
        user.setFullName(request.getFullName());
        user.setRole(role);
        user.setActive(true);

        userRepository.save(user);
        return "Đăng ký thành công tài khoản: " + request.getUsername();
    }
}