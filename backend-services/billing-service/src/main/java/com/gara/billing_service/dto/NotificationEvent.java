package com.gara.billing_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent {
    private Long customerId;
    private String title;
    private String body;
    private Map<String, String> data;
}
