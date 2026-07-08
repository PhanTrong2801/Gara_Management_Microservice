package com.gara.auth_service.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class EmployeeScheduleDto {
    private Long id;
    private Long userId;
    private String fullName;
    private String roleName;
    private Long shiftId;
    private String shiftName;
    private LocalDate workDate;
    private String status;
    private String note;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private Integer lateMinutes;
    private Boolean autoCheckout;
    private LocalDateTime createdAt;
}
