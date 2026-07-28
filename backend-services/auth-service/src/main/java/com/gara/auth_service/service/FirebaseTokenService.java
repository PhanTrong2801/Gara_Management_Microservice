package com.gara.auth_service.service;

import com.gara.auth_service.client.CustomerServiceClient;
import com.gara.auth_service.dto.AuthResponse;
import com.gara.auth_service.dto.InternalCustomerDTO;
import com.gara.auth_service.entity.Role;
import com.gara.auth_service.entity.User;
import com.gara.auth_service.repository.RoleRepository;
import com.gara.auth_service.repository.UserRepository;
import com.gara.auth_service.util.JwtUtil;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FirebaseTokenService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final CustomerServiceClient customerServiceClient;

    @Transactional
    public AuthResponse loginWithPhone(String idToken) {
        try {
            // 1. Xác thực Token với Firebase
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String uid = decodedToken.getUid();
            String phoneNumber = (String) decodedToken.getClaims().get("phone_number");

            if (phoneNumber == null) {
                // Thử lấy từ UserRecord nếu claim không có
                com.google.firebase.auth.UserRecord userRecord = FirebaseAuth.getInstance().getUser(uid);
                phoneNumber = userRecord.getPhoneNumber();
            }

            if (phoneNumber == null || phoneNumber.isEmpty()) {
                throw new RuntimeException("Token không chứa số điện thoại hợp lệ");
            }

            // Chuẩn hóa số điện thoại: đổi +84 thành số 0 ở đầu
            if (phoneNumber.startsWith("+84")) {
                phoneNumber = "0" + phoneNumber.substring(3);
            }

            // 2. Kiểm tra xem User đã tồn tại chưa (dùng SĐT làm username)
            Optional<User> userOpt = userRepository.findByUsername(phoneNumber);
            User user;

            if (userOpt.isPresent()) {
                user = userOpt.get();
                // Nếu User đã tồn tại, kiểm tra xem có bị khóa không
                if (!user.isActive()) {
                    throw new RuntimeException("Tài khoản đã bị khóa");
                }
            } else {
                // 3. Nếu chưa tồn tại -> Tự động đăng ký mới cho Khách hàng
                Role customerRole = roleRepository.findByName("CUSTOMER")
                        .orElseGet(() -> roleRepository.findByName("ROLE_CUSTOMER")
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy Role CUSTOMER")));

                user = new User();
                user.setUsername(phoneNumber);
                // Tạo một mật khẩu ngẫu nhiên cho account này vì khách dùng OTP
                user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                user.setPhone(phoneNumber);
                user.setFullName("Khách Hàng Mới");
                user.setRole(customerRole);
                user.setActive(true);

                user = userRepository.save(user);

                // Đồng bộ qua customer-service
                InternalCustomerDTO dto = InternalCustomerDTO.builder()
                        .userId(user.getId())
                        .fullName(user.getFullName())
                        .phoneNumber(user.getPhone())
                        .build();
                try {
                    customerServiceClient.createInternalCustomer(dto);
                } catch (Exception e) {
                    System.err.println("Cảnh báo: Không thể đồng bộ user qua customer-service: " + e.getMessage());
                }
            }

            // 4. Sinh JWT Token của hệ thống
            String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole().getName());
            return new AuthResponse(token, user.getUsername(), user.getRole().getName());

        } catch (FirebaseAuthException e) {
            throw new RuntimeException("Xác thực Firebase Token thất bại: " + e.getMessage());
        }
    }
}
