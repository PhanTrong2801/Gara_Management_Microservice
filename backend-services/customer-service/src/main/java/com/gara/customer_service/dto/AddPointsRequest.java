package com.gara.customer_service.dto;

import lombok.Data;

@Data
public class AddPointsRequest {
    private Double amountSpent;
    private String description;
}
