package com.gara.repair_service.controller;

import com.gara.repair_service.dto.RepairStatsDTO;
import com.gara.repair_service.repository.RepairOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;

@RestController
@RequestMapping("/api/repair/orders/stats")
@RequiredArgsConstructor
public class RepairStatsController {

    private final RepairOrderRepository repairOrderRepository;

    @GetMapping
    public ResponseEntity<RepairStatsDTO> getRepairStats() {
        Long total = repairOrderRepository.count();
        Long pending = repairOrderRepository.countByStatus("PENDING");
        Long repairing = repairOrderRepository.countByStatus("REPAIRING");
        Long completed = repairOrderRepository.countByStatus("COMPLETED");

        RepairStatsDTO stats = new RepairStatsDTO(total, pending, repairing, completed, new ArrayList<>());
        return ResponseEntity.ok(stats);
    }
}
