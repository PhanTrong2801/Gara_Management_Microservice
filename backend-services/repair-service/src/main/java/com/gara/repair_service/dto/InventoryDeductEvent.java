package com.gara.repair_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryDeductEvent {
    private String orderNumber;
    private List<PartUsage> usedParts;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartUsage {
        private Long partId;
        private Integer quantity;
    }
}
