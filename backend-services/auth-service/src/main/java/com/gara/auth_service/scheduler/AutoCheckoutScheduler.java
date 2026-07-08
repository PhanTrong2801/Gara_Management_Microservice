package com.gara.auth_service.scheduler;

import com.gara.auth_service.entity.EmployeeSchedule;
import com.gara.auth_service.repository.EmployeeScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Tác vụ nền (Cron Job) chạy tự động mỗi 15 phút.
 * 
 * Mục đích: Tìm những nhân viên đã Check-in nhưng QUÊN Check-out.
 * 
 * Điều kiện kích hoạt:
 *   - Trạng thái đang là IN_PROGRESS hoặc LATE (đã Check-in rồi)
 *   - Giờ kết thúc ca đã QUÁ so với thời điểm hiện tại
 * 
 * Hành động:
 *   - Tự động đặt checkOutTime = giờ kết thúc ca (không phải giờ hiện tại)
 *   - Đánh dấu autoCheckout = true (để phân biệt với checkout bình thường)
 *   - Chuyển trạng thái sang COMPLETED
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AutoCheckoutScheduler {

    private final EmployeeScheduleRepository scheduleRepository;

    /**
     * Chạy mỗi 15 phút: 0, 15, 30, 45 mỗi giờ, từ 6h sáng đến 23h đêm.
     * Ví dụ: 06:00, 06:15, 06:30, ..., 22:45, 23:00
     */
    @Scheduled(cron = "0 0/15 6-23 * * ?")
    public void autoCheckoutForgottenShifts() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        log.info("[AutoCheckout] 🔍 Đang quét ca quên checkout... Thời điểm: {}", LocalDateTime.now());

        // Lấy tất cả lịch làm việc hôm nay đang ở trạng thái "đang làm"
        List<EmployeeSchedule> activeSchedules = scheduleRepository.findByWorkDateBetween(today, today);

        int autoCheckedOut = 0;

        for (EmployeeSchedule schedule : activeSchedules) {
            // Chỉ xử lý ca đang diễn ra (đã Check-in nhưng chưa Check-out)
            boolean isActive = "IN_PROGRESS".equals(schedule.getStatus()) || "LATE".equals(schedule.getStatus());
            if (!isActive) continue;

            // Kiểm tra: Giờ kết thúc ca đã qua chưa?
            LocalTime shiftEndTime = schedule.getShift().getEndTime();
            if (now.isAfter(shiftEndTime)) {
                // === TỰ ĐỘNG CHECKOUT ===
                // Đặt giờ ra = giờ kết thúc ca (vì không biết nhân viên rời đi lúc nào)
                schedule.setCheckOutTime(LocalDateTime.of(today, shiftEndTime));
                schedule.setAutoCheckout(true);
                schedule.setStatus("COMPLETED");
                schedule.setNote((schedule.getNote() != null ? schedule.getNote() + " | " : "") 
                        + "⚠️ Hệ thống tự động checkout (quên quét mã ra ca)");
                
                scheduleRepository.save(schedule);
                autoCheckedOut++;

                log.info("[AutoCheckout] ✅ Tự động checkout cho {} - Ca {} ngày {}", 
                        schedule.getUser().getFullName(), 
                        schedule.getShift().getShiftName(), 
                        schedule.getWorkDate());
            }
        }

        if (autoCheckedOut > 0) {
            log.info("[AutoCheckout] 🏁 Hoàn tất! Đã tự động checkout {} ca quên.", autoCheckedOut);
        }
    }
}
