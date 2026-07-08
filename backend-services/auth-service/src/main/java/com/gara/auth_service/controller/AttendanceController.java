package com.gara.auth_service.controller;

import com.gara.auth_service.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    /**
     * Web Manager gọi API này mỗi 30s để hiển thị QR
     */
    @GetMapping("/qr-token")
    public ResponseEntity<Map<String, String>> getDynamicQrToken() {
        String token = attendanceService.generateDynamicQrToken();
        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        return ResponseEntity.ok(response);
    }

    /**
     * Mobile App (nhân viên) gọi API này sau khi quét QR
     */
    @PostMapping("/scan")
    public ResponseEntity<Map<String, String>> scanAttendanceQr(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        String qrToken = payload.get("qrToken").toString();
        
        try {
            String result = attendanceService.scanAttendanceQr(userId, qrToken);
            String[] parts = result.split("\\|");
            
            Map<String, String> response = new HashMap<>();
            response.put("status", parts[0]); // CHECK_IN_SUCCESS, CHECK_IN_LATE, CHECK_OUT_SUCCESS
            response.put("lateMinutes", parts[1]);
            
            if ("CHECK_IN_LATE".equals(parts[0])) {
                response.put("message", "Bạn đã đi trễ " + parts[1] + " phút!");
            } else if ("CHECK_IN_SUCCESS".equals(parts[0])) {
                response.put("message", "Điểm danh vào ca thành công!");
            } else {
                response.put("message", "Đã điểm danh kết thúc ca!");
            }
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
