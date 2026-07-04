package com.gara.repair_service.service;

import com.gara.repair_service.entity.Appointment;
import com.gara.repair_service.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;

    public Appointment createAppointment(Appointment appointment) {
        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getAppointmentsByCustomerId(Long customerId) {
        return appointmentRepository.findByCustomerId(customerId);
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public Page<Appointment> getAllAppointments(String keyword, Pageable pageable) {
        if (keyword == null || keyword.isBlank()) {
            return appointmentRepository.findAll(pageable);
        }
        return appointmentRepository.searchAppointments(keyword, pageable);
    }

    public Appointment updateAppointmentStatus(String id, String status) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch hẹn"));
        appointment.setStatus(status);
        return appointmentRepository.save(appointment);
    }
}
