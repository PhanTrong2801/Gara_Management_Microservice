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

import com.gara.auth_service.config.RabbitMQConfig;
import com.gara.auth_service.dto.ScheduleNotificationEvent;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final ShiftRepository shiftRepository;
    private final EmployeeScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final RabbitTemplate rabbitTemplate;

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

    public ShiftDto updateShift(Long id, ShiftDto shiftDto) {
        Shift shift = shiftRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shift not found"));
        shift.setShiftName(shiftDto.getShiftName());
        shift.setStartTime(shiftDto.getStartTime());
        shift.setEndTime(shiftDto.getEndTime());
        shift.setDescription(shiftDto.getDescription());
        return mapToShiftDto(shiftRepository.save(shift));
    }

    public void deleteShift(Long id) {
        shiftRepository.deleteById(id);
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

        List<EmployeeSchedule> existing = scheduleRepository.findByUserIdAndShiftIdAndWorkDate(dto.getUserId(), dto.getShiftId(), dto.getWorkDate());
        if (!existing.isEmpty()) {
            throw new RuntimeException("Nhân viên này đã được xếp vào ca này trong ngày " + dto.getWorkDate());
        }

        EmployeeSchedule schedule = new EmployeeSchedule();
        schedule.setUser(user);
        schedule.setShift(shift);
        schedule.setWorkDate(dto.getWorkDate());
        schedule.setStatus(dto.getStatus() != null ? dto.getStatus() : "ASSIGNED_BY_MANAGER");
        schedule.setNote(dto.getNote());

        EmployeeSchedule saved = scheduleRepository.save(schedule);
        
        // Notify user about assignment
        ScheduleNotificationEvent event = new ScheduleNotificationEvent(
                user.getId(),
                "Bạn có lịch làm việc mới",
                "Quản lý đã xếp bạn làm việc ngày " + saved.getWorkDate() + " ca " + saved.getShift().getShiftName(),
                "SCHEDULE_UPDATE"
        );
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, RabbitMQConfig.SCHEDULE_ROUTING_KEY, event);

        return mapToScheduleDto(saved);
    }
    
    public EmployeeScheduleDto registerSchedule(Long userId, Long shiftId, LocalDate workDate) {
        List<EmployeeSchedule> existing = scheduleRepository.findByUserIdAndShiftIdAndWorkDate(userId, shiftId, workDate);
        if (!existing.isEmpty()) {
            throw new RuntimeException("Bạn đã đăng ký ca này trong ngày " + workDate + " rồi.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new RuntimeException("Shift not found"));

        EmployeeSchedule schedule = new EmployeeSchedule();
        schedule.setUser(user);
        schedule.setShift(shift);
        schedule.setWorkDate(workDate);
        schedule.setStatus("PENDING_APPROVAL");

        return mapToScheduleDto(scheduleRepository.save(schedule));
    }

    public List<EmployeeScheduleDto> getPendingSchedules() {
        return scheduleRepository.findByStatus("PENDING_APPROVAL").stream()
                .map(this::mapToScheduleDto).collect(Collectors.toList());
    }

    public EmployeeScheduleDto approveSchedule(Long id) {
        EmployeeSchedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        schedule.setStatus("SCHEDULED");
        EmployeeSchedule saved = scheduleRepository.save(schedule);

        ScheduleNotificationEvent event = new ScheduleNotificationEvent(
                schedule.getUser().getId(),
                "Lịch làm việc đã duyệt",
                "Đăng ký làm việc ngày " + schedule.getWorkDate() + " ca " + schedule.getShift().getShiftName() + " của bạn đã được quản lý phê duyệt.",
                "SCHEDULE_UPDATE"
        );
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, RabbitMQConfig.SCHEDULE_ROUTING_KEY, event);

        return mapToScheduleDto(saved);
    }

    public EmployeeScheduleDto rejectSchedule(Long id) {
        EmployeeSchedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));
        schedule.setStatus("REJECTED");
        EmployeeSchedule saved = scheduleRepository.save(schedule);

        ScheduleNotificationEvent event = new ScheduleNotificationEvent(
                schedule.getUser().getId(),
                "Lịch làm việc bị từ chối",
                "Rất tiếc, đăng ký làm việc ngày " + schedule.getWorkDate() + " ca " + schedule.getShift().getShiftName() + " của bạn không được duyệt.",
                "SCHEDULE_UPDATE"
        );
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, RabbitMQConfig.SCHEDULE_ROUTING_KEY, event);

        return mapToScheduleDto(saved);
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
        dto.setCreatedAt(schedule.getCreatedAt());
        return dto;
    }
}
