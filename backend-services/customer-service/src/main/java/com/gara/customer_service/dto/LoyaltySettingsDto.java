package com.gara.customer_service.dto;

import lombok.Data;

@Data
public class LoyaltySettingsDto {
    private Double vndPerPoint;
    private Integer silverThreshold;
    private Integer goldThreshold;
    private Integer platinumThreshold;
}
