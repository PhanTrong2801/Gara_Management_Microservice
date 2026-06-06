package com.gara.repair_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockCheckRequest {
    private List<PartRequest> parts;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PartRequest {
        private Long partId;
        private Integer quantity;
    }
}
