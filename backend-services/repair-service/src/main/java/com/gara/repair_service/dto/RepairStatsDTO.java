package com.gara.repair_service.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RepairStatsDTO {
    private Long totalOrders;
    private Long pendingCount;
    private Long repairingCount;
    private Long completedCount;
    private List<MechanicPerformanceDTO> mechanicPerformances;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MechanicPerformanceDTO {
        private Long mechanicId;
        private Long taskCount;
    }
}
