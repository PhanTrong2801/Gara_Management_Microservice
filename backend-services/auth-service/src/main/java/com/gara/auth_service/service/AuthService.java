package com.gara.auth_service.service;

import com.gara.auth_service.dto.AuthRequest;
import com.gara.auth_service.dto.AuthResponse;
import com.gara.auth_service.dto.RegisterRequest;
import com.gara.auth_service.entity.Role;
import com.gara.auth_service.entity.User;
import com.gara.auth_service.repository.RoleRepository;
import com.gara.auth_service.repository.UserRepository;
import com.gara.auth_service.util.JwtUtil;
import com.gara.auth_service.client.CustomerServiceClient;
import com.gara.auth_service.dto.InternalCustomerDTO;
import com.gara.auth_service.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final CustomerServiceClient customerServiceClient;

    // Logic Đăng nhập
    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Sai mật khẩu");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole().getName());
        return new AuthResponse(token, user.getUsername(), user.getRole().getName());
    }

    // Logic Đăng ký
    @Transactional
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

        user = userRepository.save(user);

        // Nếu là tài khoản CUSTOMER thì đồng bộ qua customer-service
        if (role.getName().equalsIgnoreCase("CUSTOMER") || role.getName().equalsIgnoreCase("ROLE_CUSTOMER")) {
            InternalCustomerDTO dto = InternalCustomerDTO.builder()
                    .userId(user.getId())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .phoneNumber(user.getPhone())
                    .build();
            // Không dùng try-catch ở đây để exception từ Feign (hoặc Fallback) bay thẳng ra ngoài
            // Spring @Transactional sẽ tự động Rollback giao dịch lưu User ở trên
            customerServiceClient.createInternalCustomer(dto);
        }

        return "Đăng ký thành công tài khoản: " + request.getUsername();
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> new UserDto(
                        user.getId(),
                        user.getUsername(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getPhone(),
                        null,
                        user.getRole().getName(),
                        user.isActive()
                )).collect(Collectors.toList());
    }

    public UserDto updateUser(Long id, UserDto request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
                
        Role role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Role: " + request.getRole()));

        user.setRole(role);
        user.setActive(request.getIsActive() != null ? request.getIsActive() : false);
        
        if (request.getFullName() != null && !request.getFullName().isEmpty()) {
            user.setFullName(request.getFullName());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        }
        
        userRepository.save(user);
        
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                null,
                user.getRole().getName(),
                user.isActive()
        );
    }

    public UserDto getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản: " + username));
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                null,
                user.getRole().getName(),
                user.isActive()
        );
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + id));
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                null,
                user.getRole().getName(),
                user.isActive()
        );
    }
}