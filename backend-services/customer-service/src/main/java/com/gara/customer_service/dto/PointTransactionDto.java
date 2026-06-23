package com.gara.customer_service.dto;

import com.gara.customer_service.entity.enums.TransactionType;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PointTransactionDto {
    private Long id;
    private Long customerId;
    private Integer points;
    private TransactionType type;
    private String description;
    private LocalDateTime createdAt;
}
