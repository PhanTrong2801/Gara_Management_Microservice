package com.gara.auth_service.service;

import com.gara.auth_service.dto.EmployeeScheduleDto;
import com.gara.auth_service.dto.ShiftDto;
import com.gara.auth_service.entity.EmployeeSchedule;
import com.gara.auth_service.entity.Shift;
import com.gara.auth_service.entity.User;
import com.gara.auth_service.repository.EmployeeScheduleRepository;
import com.gara.auth_service.repository.ShiftRepository;
import com.gara.auth_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ShiftRepository shiftRepository;
    private final EmployeeScheduleRepository scheduleRepository;
    private final UserRepository userRepository;

    // --- Shift Management ---
    public List<ShiftDto> getAllShifts() {
        return shiftRepository.findAll().stream().map(this::mapToShiftDto).collect(Collectors.toList());
    }

    public ShiftDto createShift(ShiftDto shiftDto) {
        Shift shift = new Shift();
        shift.setShiftName(shiftDto.getShiftName());
        shift.setStartTime(shiftDto.getStartTime());
        shift.setEndTime(shiftDto.getEndTime());
        shift.setDescription(shiftDto.getDescription());
        return mapToShiftDto(shiftRepository.save(shift));
    }

    // --- Schedule Management ---
    public List<EmployeeScheduleDto> getSchedulesBetween(LocalDate startDate, LocalDate endDate) {
        return scheduleRepository.findByWorkDateBetween(startDate, endDate)
                .stream().map(this::mapToScheduleDto).collect(Collectors.toList());
    }

    public List<EmployeeScheduleDto> getSchedulesForUser(Long userId, LocalDate startDate, LocalDate endDate) {
        return scheduleRepository.findByUserIdAndWorkDateBetween(userId, startDate, endDate)
                .stream().map(this::mapToScheduleDto).collect(Collectors.toList());
    }

    public EmployeeScheduleDto assignSchedule(EmployeeScheduleDto dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Shift shift = shiftRepository.findById(dto.getShiftId())
                .orElseThrow(() -> new RuntimeException("Shift not found"));

        EmployeeSchedule schedule = new EmployeeSchedule();
        schedule.setUser(user);
        schedule.setShift(shift);
        schedule.setWorkDate(dto.getWorkDate());
        schedule.setStatus(dto.getStatus() != null ? dto.getStatus() : "SCHEDULED");
        schedule.setNote(dto.getNote());

        return mapToScheduleDto(scheduleRepository.save(schedule));
    }
    
    public void deleteSchedule(Long id) {
        scheduleRepository.deleteById(id);
    }

    // --- Mappers ---
    private ShiftDto mapToShiftDto(Shift shift) {
        ShiftDto dto = new ShiftDto();
        dto.setId(shift.getId());
        dto.setShiftName(shift.getShiftName());
        dto.setStartTime(shift.getStartTime());
        dto.setEndTime(shift.getEndTime());
        dto.setDescription(shift.getDescription());
        return dto;
    }

    private EmployeeScheduleDto mapToScheduleDto(EmployeeSchedule schedule) {
        EmployeeScheduleDto dto = new EmployeeScheduleDto();
        dto.setId(schedule.getId());
        dto.setUserId(schedule.getUser().getId());
        dto.setFullName(schedule.getUser().getFullName());
        dto.setRoleName(schedule.getUser().getRole().getName());
        dto.setShiftId(schedule.getShift().getId());
        dto.setShiftName(schedule.getShift().getShiftName());
        dto.setWorkDate(schedule.getWorkDate());
        dto.setStatus(schedule.getStatus());
        dto.setNote(schedule.getNote());
        return dto;
    }
}
