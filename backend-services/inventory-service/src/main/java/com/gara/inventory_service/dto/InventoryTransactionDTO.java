package com.gara.inventory_service.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class InventoryTransactionDTO {
    private Long id;
    private Long partId;
    private String transactionType;
    private int quantity;
    private String reference;
    private LocalDateTime transactionDate;
}
