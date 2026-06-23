package com.gara.customer_service.dto;

import com.gara.customer_service.entity.enums.Tier;
import lombok.Data;

@Data
public class CustomerLoyaltyDto {
    private Long id;
    private Long customerId;
    private Integer totalPoints;
    private Tier tier;
    private Double totalSpent;
}
