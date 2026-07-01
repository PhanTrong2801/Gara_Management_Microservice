package com.gara.auth_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleNotificationEvent {
    private Long userId;
    private String title;
    private String body;
    private String type; // e.g., "SCHEDULE_UPDATE"
}
