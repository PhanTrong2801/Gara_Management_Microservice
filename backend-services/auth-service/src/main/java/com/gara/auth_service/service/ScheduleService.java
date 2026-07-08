package com.gara.auth_service.service;

import com.gara.auth_service.dto.EmployeeScheduleDto;
import com.gara.auth_service.dto.ShiftDto;
import com.gara.auth_service.entity.EmployeeSchedule;
import com.gara.auth_service.entity.Shift;
import com.gara.auth_service.entity.User;
import com.gara.auth_service.repository.DailyShiftConfigRepository;
import com.gara.auth_service.repository.EmployeeScheduleRepository;
import com.gara.auth_service.repository.ShiftRepository;
import com.gara.auth_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import com.gara.auth_service.entity.DailyShiftConfig;
import com.gara.auth_service.dto.DailyShiftConfigDto;

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
    private final DailyShiftConfigRepository dailyConfigRepository;

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
        shift.setMaxMechanics(shiftDto.getMaxMechanics() != null ? shiftDto.getMaxMechanics() : 2);
        shift.setMaxCashiers(shiftDto.getMaxCashiers() != null ? shiftDto.getMaxCashiers() : 1);
        return mapToShiftDto(shiftRepository.save(shift));
    }

    public ShiftDto updateShift(Long id, ShiftDto shiftDto) {
        Shift shift = shiftRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shift not found"));
        shift.setShiftName(shiftDto.getShiftName());
        shift.setStartTime(shiftDto.getStartTime());
        shift.setEndTime(shiftDto.getEndTime());
        shift.setDescription(shiftDto.getDescription());
        if (shiftDto.getMaxMechanics() != null) shift.setMaxMechanics(shiftDto.getMaxMechanics());
        if (shiftDto.getMaxCashiers() != null) shift.setMaxCashiers(shiftDto.getMaxCashiers());
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
        EmployeeSchedule scheduleToUpdate = null;
        for (EmployeeSchedule s : existing) {
            if (!"REJECTED".equals(s.getStatus())) {
                throw new RuntimeException("Nhân viên này đã được xếp vào ca này trong ngày " + dto.getWorkDate());
            } else {
                scheduleToUpdate = s;
            }
        }

        // Determine capacity limits (override vs template)
        int maxMechanics = shift.getMaxMechanics() == 0 ? 2 : shift.getMaxMechanics();
        int maxCashiers = shift.getMaxCashiers() == 0 ? 1 : shift.getMaxCashiers();
        
        Optional<DailyShiftConfig> dailyConfig = dailyConfigRepository.findByShiftIdAndWorkDate(shift.getId(), dto.getWorkDate());
        if (dailyConfig.isPresent()) {
            maxMechanics = dailyConfig.get().getMaxMechanics();
            maxCashiers = dailyConfig.get().getMaxCashiers();
        }

        // Kiểm tra giới hạn số lượng nhân sự
        String roleName = user.getRole().getName();
        if ("MECHANIC".equals(roleName)) {
            int mechanicCount = scheduleRepository.countByShiftIdAndWorkDateAndUserRoleName(shift.getId(), dto.getWorkDate(), "MECHANIC");
            if (mechanicCount >= maxMechanics) {
                throw new RuntimeException("Rất tiếc, Ca này đã đạt giới hạn tối đa " + maxMechanics + " Thợ.");
            }
        } else if ("RECEPTIONIST".equals(roleName) || "CASHIER".equals(roleName)) {
            int cashierCount = scheduleRepository.countByShiftIdAndWorkDateAndUserRoleName(shift.getId(), dto.getWorkDate(), roleName);
            if (cashierCount >= maxCashiers) {
                throw new RuntimeException("Rất tiếc, Ca này đã đạt giới hạn tối đa " + maxCashiers + " " + roleName + ".");
            }
        }

        if (scheduleToUpdate == null) {
            scheduleToUpdate = new EmployeeSchedule();
            scheduleToUpdate.setUser(user);
            scheduleToUpdate.setShift(shift);
            scheduleToUpdate.setWorkDate(dto.getWorkDate());
        }
        scheduleToUpdate.setStatus(dto.getStatus() != null ? dto.getStatus() : "ASSIGNED_BY_MANAGER");
        scheduleToUpdate.setNote(dto.getNote());

        EmployeeSchedule saved = scheduleRepository.save(scheduleToUpdate);
        
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
        EmployeeSchedule scheduleToUpdate = null;
        for (EmployeeSchedule s : existing) {
            if (!"REJECTED".equals(s.getStatus())) {
                throw new RuntimeException("Bạn đã đăng ký ca này trong ngày " + workDate + " rồi.");
            } else {
                scheduleToUpdate = s;
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User không tìm thấy"));
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new RuntimeException("Ca làm việc không tìm thấy"));

        // Determine capacity limits (override vs template)
        int maxMechanics = shift.getMaxMechanics() == 0 ? 2 : shift.getMaxMechanics();
        int maxCashiers = shift.getMaxCashiers() == 0 ? 1 : shift.getMaxCashiers();
        
        Optional<DailyShiftConfig> dailyConfig = dailyConfigRepository.findByShiftIdAndWorkDate(shift.getId(), workDate);
        if (dailyConfig.isPresent()) {
            maxMechanics = dailyConfig.get().getMaxMechanics();
            maxCashiers = dailyConfig.get().getMaxCashiers();
        }

        // Kiểm tra giới hạn số lượng nhân sự
        String roleName = user.getRole().getName();
        if ("MECHANIC".equals(roleName)) {
            int mechanicCount = scheduleRepository.countByShiftIdAndWorkDateAndUserRoleName(shift.getId(), workDate, "MECHANIC");
            if (mechanicCount >= maxMechanics) {
                throw new RuntimeException("Rất tiếc, Ca này đã đạt giới hạn tối đa " + maxMechanics + " Thợ.");
            }
        } else if ("RECEPTIONIST".equals(roleName) || "CASHIER".equals(roleName)) {
            int cashierCount = scheduleRepository.countByShiftIdAndWorkDateAndUserRoleName(shift.getId(), workDate, roleName);
            if (cashierCount >= maxCashiers) {
                throw new RuntimeException("Rất tiếc, Ca này đã đạt giới hạn tối đa " + maxCashiers + " " + roleName + ".");
            }
        }

        if (scheduleToUpdate == null) {
            scheduleToUpdate = new EmployeeSchedule();
            scheduleToUpdate.setUser(user);
            scheduleToUpdate.setShift(shift);
            scheduleToUpdate.setWorkDate(workDate);
        }
        scheduleToUpdate.setStatus("PENDING_APPROVAL");

        return mapToScheduleDto(scheduleRepository.save(scheduleToUpdate));
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
        dto.setMaxMechanics(shift.getMaxMechanics());
        dto.setMaxCashiers(shift.getMaxCashiers());
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
        dto.setCheckInTime(schedule.getCheckInTime());
        dto.setCheckOutTime(schedule.getCheckOutTime());
        dto.setLateMinutes(schedule.getLateMinutes());
        dto.setAutoCheckout(schedule.getAutoCheckout());
        dto.setCreatedAt(schedule.getCreatedAt());
        return dto;
    }

    // --- Daily Shift Config Management ---
    public List<DailyShiftConfigDto> getDailyConfigsBetween(LocalDate startDate, LocalDate endDate) {
        return dailyConfigRepository.findByWorkDateBetween(startDate, endDate).stream()
                .map(this::mapToDailyConfigDto).collect(Collectors.toList());
    }

    public DailyShiftConfigDto upsertDailyConfig(DailyShiftConfigDto dto) {
        Shift shift = shiftRepository.findById(dto.getShiftId())
                .orElseThrow(() -> new RuntimeException("Shift not found"));
                
        DailyShiftConfig config = dailyConfigRepository.findByShiftIdAndWorkDate(dto.getShiftId(), dto.getWorkDate())
                .orElse(new DailyShiftConfig());
                
        config.setShift(shift);
        config.setWorkDate(dto.getWorkDate());
        config.setMaxMechanics(dto.getMaxMechanics());
        config.setMaxCashiers(dto.getMaxCashiers());
        config.setNote(dto.getNote());
        
        return mapToDailyConfigDto(dailyConfigRepository.save(config));
    }

    private DailyShiftConfigDto mapToDailyConfigDto(DailyShiftConfig config) {
        DailyShiftConfigDto dto = new DailyShiftConfigDto();
        dto.setId(config.getId());
        dto.setShiftId(config.getShift().getId());
        dto.setWorkDate(config.getWorkDate());
        dto.setMaxMechanics(config.getMaxMechanics());
        dto.setMaxCashiers(config.getMaxCashiers());
        dto.setNote(config.getNote());
        return dto;
    }
}
