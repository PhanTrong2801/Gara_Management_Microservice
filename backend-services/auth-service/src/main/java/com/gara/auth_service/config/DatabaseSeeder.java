package com.gara.auth_service.config;

import com.gara.auth_service.entity.Role;
import com.gara.auth_service.entity.User;
import com.gara.auth_service.repository.RoleRepository;
import com.gara.auth_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        seedRoles();
        seedAdminUser();
    }

    private void seedRoles() {
        if (roleRepository.count() == 0) {
            log.info("Bắt đầu khởi tạo các Quyền (Roles) mặc định...");
            List<String> roleNames = Arrays.asList("ADMIN", "MANAGER", "MECHANIC", "RECEPTIONIST", "CUSTOMER");
            
            for (String roleName : roleNames) {
                Role role = new Role();
                role.setName(roleName);
                roleRepository.save(role);
            }
            log.info("Khởi tạo Roles thành công!");
        } else {
            log.info("Bảng Roles đã có dữ liệu, bỏ qua khởi tạo.");
        }
    }

    private void seedAdminUser() {
        if (userRepository.findByUsername("admin").isEmpty()) {
            log.info("Bắt đầu khởi tạo tài khoản Admin mặc định...");
            
            Role adminRole = roleRepository.findByName("ADMIN")
                    .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy quyền ADMIN để gán cho tài khoản admin"));

            User adminUser = new User();
            adminUser.setUsername("admin");
            adminUser.setPassword(passwordEncoder.encode("admin123")); // Mật khẩu mặc định
            adminUser.setFullName("Quản trị viên Hệ thống");
            adminUser.setRole(adminRole);
            adminUser.setActive(true);

            userRepository.save(adminUser);
            log.info("Khởi tạo tài khoản Admin (admin/admin123) thành công!");
        } else {
            log.info("Tài khoản admin đã tồn tại, bỏ qua khởi tạo.");
        }
    }
}
