package com.gara.auth_service.controller;

import com.gara.auth_service.dto.EmployeeScheduleDto;
import com.gara.auth_service.dto.ShiftDto;
import com.gara.auth_service.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/auth/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    // --- Shift API ---
    @GetMapping("/shifts")
    public ResponseEntity<List<ShiftDto>> getAllShifts() {
        return ResponseEntity.ok(scheduleService.getAllShifts());
    }

    @PostMapping("/shifts")
    public ResponseEntity<ShiftDto> createShift(@RequestBody ShiftDto dto) {
        return ResponseEntity.ok(scheduleService.createShift(dto));
    }

    // --- Schedule API ---
    @GetMapping
    public ResponseEntity<List<EmployeeScheduleDto>> getSchedules(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(scheduleService.getSchedulesBetween(startDate, endDate));
    }

    @PostMapping
    public ResponseEntity<EmployeeScheduleDto> assignSchedule(@RequestBody EmployeeScheduleDto dto) {
        return ResponseEntity.ok(scheduleService.assignSchedule(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        scheduleService.deleteSchedule(id);
        return ResponseEntity.ok().build();
    }
}
