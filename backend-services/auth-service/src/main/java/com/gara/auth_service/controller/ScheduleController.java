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

    @PutMapping("/shifts/{id}")
    public ResponseEntity<ShiftDto> updateShift(@PathVariable Long id, @RequestBody ShiftDto dto) {
        return ResponseEntity.ok(scheduleService.updateShift(id, dto));
    }

    @DeleteMapping("/shifts/{id}")
    public ResponseEntity<Void> deleteShift(@PathVariable Long id) {
        scheduleService.deleteShift(id);
        return ResponseEntity.ok().build();
    }

    // --- Schedule API ---
    @GetMapping
    public ResponseEntity<List<EmployeeScheduleDto>> getSchedules(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(scheduleService.getSchedulesBetween(startDate, endDate));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<List<EmployeeScheduleDto>> getSchedulesForUser(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(scheduleService.getSchedulesForUser(userId, startDate, endDate));
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

    // --- Registration & Approval API ---
    @PostMapping("/register")
    public ResponseEntity<EmployeeScheduleDto> registerSchedule(@RequestBody EmployeeScheduleDto dto) {
        // Trong thực tế, lấy userId từ JWT Token qua SecurityContextHolder để bảo mật.
        // Tạm thời lấy từ body cho phiên bản demo này.
        return ResponseEntity.ok(scheduleService.registerSchedule(dto.getUserId(), dto.getShiftId(), dto.getWorkDate()));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<EmployeeScheduleDto>> getPendingSchedules() {
        return ResponseEntity.ok(scheduleService.getPendingSchedules());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<EmployeeScheduleDto> approveSchedule(@PathVariable Long id) {
        return ResponseEntity.ok(scheduleService.approveSchedule(id));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<EmployeeScheduleDto> rejectSchedule(@PathVariable Long id) {
        return ResponseEntity.ok(scheduleService.rejectSchedule(id));
    }
}
