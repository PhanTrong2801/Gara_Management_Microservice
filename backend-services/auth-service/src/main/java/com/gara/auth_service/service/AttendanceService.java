package com.gara.auth_service.service;

import com.gara.auth_service.entity.EmployeeSchedule;
import com.gara.auth_service.repository.EmployeeScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final EmployeeScheduleRepository scheduleRepository;

    // Khóa bí mật dùng để tạo chữ ký chống làm giả QR (Trong thực tế nên cấu hình ở application.yml)
    private static final String QR_SECRET_KEY = "GaraOtoManagementQRSecret_2026";
    // Thời gian sống của một mã QR (30 giây)
    private static final long QR_EXPIRATION_MILLIS = 30000;
    // Số phút đi trễ cho phép châm trước (Grace period)
    private static final int LATE_GRACE_MINUTES = 5;

    /**
     * Sinh ra một mã Token để hiển thị trên màn hình QR Code.
     * Cấu trúc: "CHECK_IN|<Thời_gian_hết_hạn_Millis>|<Chữ_ký_SHA256>"
     */
    public String generateDynamicQrToken() {
        long expirationTime = System.currentTimeMillis() + QR_EXPIRATION_MILLIS;
        String payload = "CHECK_IN|" + expirationTime;
        String signature = generateSignature(payload);
        String rawToken = payload + "|" + signature;
        // Mã hóa Base64 để chuỗi gọn gàng khi làm mã QR
        return Base64.getEncoder().encodeToString(rawToken.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Xử lý quét mã điểm danh từ Mobile App
     */
    public String scanAttendanceQr(Long userId, String base64Token) {
        // 1. Giải mã và Xác thực Token
        String rawToken;
        try {
            rawToken = new String(Base64.getDecoder().decode(base64Token), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Định dạng mã QR không hợp lệ!");
        }

        String[] parts = rawToken.split("\\|");
        if (parts.length != 3 || !"CHECK_IN".equals(parts[0])) {
            throw new RuntimeException("Mã QR không đúng định dạng chấm công!");
        }

        long expirationTime = Long.parseLong(parts[1]);
        String signature = parts[2];

        // 2. Kiểm tra chữ ký (Chống làm giả)
        String expectedSignature = generateSignature(parts[0] + "|" + parts[1]);
        if (!expectedSignature.equals(signature)) {
            throw new RuntimeException("Mã QR giả mạo hoặc không hợp lệ!");
        }

        // 3. Kiểm tra hạn sử dụng (30 giây)
        if (System.currentTimeMillis() > expirationTime) {
            throw new RuntimeException("Mã QR đã hết hạn! Vui lòng quét mã mới trên màn hình.");
        }

        // 4. Xử lý Logic Điểm danh
        LocalDate today = LocalDate.now();
        LocalTime currentTime = LocalTime.now();
        List<EmployeeSchedule> schedules = scheduleRepository.findByUserIdAndWorkDateBetween(userId, today, today);
        
        // ===== THUẬT TOÁN CHỌN CA THÔNG MINH =====
        // Ưu tiên 1: Tìm ca đang diễn ra (IN_PROGRESS / LATE) cần Check-out
        //   → Chọn ca có giờ kết thúc chưa qua hoặc gần nhất (tránh checkout nhầm ca sáng khi đang ca chiều)
        EmployeeSchedule activeSchedule = schedules.stream()
                .filter(s -> "IN_PROGRESS".equals(s.getStatus()) || "LATE".equals(s.getStatus()))
                .min((a, b) -> {
                    // Ca nào có giờ kết thúc gần currentTime nhất nhưng chưa qua → ưu tiên
                    long diffA = Math.abs(java.time.Duration.between(currentTime, a.getShift().getEndTime()).toMinutes());
                    long diffB = Math.abs(java.time.Duration.between(currentTime, b.getShift().getEndTime()).toMinutes());
                    return Long.compare(diffA, diffB);
                })
                .orElse(null);

        // Ưu tiên 2: Nếu không có ca nào đang diễn ra → Tìm ca chưa Check-in gần nhất
        if (activeSchedule == null) {
            activeSchedule = schedules.stream()
                    .filter(s -> "SCHEDULED".equals(s.getStatus()) || "ASSIGNED_BY_MANAGER".equals(s.getStatus()))
                    .min((a, b) -> {
                        // Ca nào có giờ bắt đầu gần currentTime nhất → ưu tiên
                        long diffA = Math.abs(java.time.Duration.between(currentTime, a.getShift().getStartTime()).toMinutes());
                        long diffB = Math.abs(java.time.Duration.between(currentTime, b.getShift().getStartTime()).toMinutes());
                        return Long.compare(diffA, diffB);
                    })
                    .orElseThrow(() -> new RuntimeException("Bạn không có ca làm việc nào đang chờ hoặc đang diễn ra trong hôm nay."));
        }

        LocalDateTime now = LocalDateTime.now();

        // NẾU CHƯA CHECK-IN -> THỰC HIỆN CHECK-IN
        if (activeSchedule.getCheckInTime() == null) {
            activeSchedule.setCheckInTime(now);
            
            // Tính số phút đi trễ
            LocalTime shiftStartTime = activeSchedule.getShift().getStartTime();
            LocalDateTime expectedStart = LocalDateTime.of(today, shiftStartTime);
            
            // Nếu Check-in trễ hơn giờ bắt đầu + số phút châm trước
            if (now.isAfter(expectedStart.plusMinutes(LATE_GRACE_MINUTES))) {
                long lateMinutes = ChronoUnit.MINUTES.between(expectedStart, now);
                activeSchedule.setLateMinutes((int) lateMinutes);
                activeSchedule.setStatus("LATE");
                scheduleRepository.save(activeSchedule);
                return "CHECK_IN_LATE|" + lateMinutes; // Trả về thông điệp báo trễ
            } else {
                activeSchedule.setLateMinutes(0);
                activeSchedule.setStatus("IN_PROGRESS");
                scheduleRepository.save(activeSchedule);
                return "CHECK_IN_SUCCESS|0";
            }
        } 
        // NẾU ĐÃ CHECK-IN -> THỰC HIỆN CHECK-OUT
        else if (activeSchedule.getCheckOutTime() == null) {
            activeSchedule.setCheckOutTime(now);
            activeSchedule.setStatus("COMPLETED");
            scheduleRepository.save(activeSchedule);
            return "CHECK_OUT_SUCCESS|0";
        } 
        // NẾU ĐÃ CHECK-OUT RỒI
        else {
            throw new RuntimeException("Bạn đã hoàn thành điểm danh cho ca này rồi!");
        }
    }

    private String generateSignature(String payload) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String dataToHash = payload + QR_SECRET_KEY;
            byte[] hashBytes = digest.digest(dataToHash.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi thuật toán mã hóa", e);
        }
    }
}
