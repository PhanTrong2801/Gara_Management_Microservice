package com.gara.inventory_service.dto;

import lombok.Data;
import java.util.List;

@Data
public class PurchaseOrderDTO {
    private Long supplierId;
    private List<PurchaseOrderItemDTO> items;

    @Data
    public static class PurchaseOrderItemDTO {
        private Long partId;
        private Integer quantity;
        private Double unitPrice;
    }
}
