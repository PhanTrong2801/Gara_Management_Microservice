package com.gara.auth_service.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Entity
@Data
@Table(name = "shifts")
@NoArgsConstructor
public class Shift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "shift_name", nullable = false, length = 50)
    private String shiftName; // Ví dụ: Ca Sáng, Ca Chiều, Hành chính

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(length = 255)
    private String description;

    @Column(name = "max_mechanics", nullable = false)
    private Integer maxMechanics = 2; // Mặc định 2 Thợ

    @Column(name = "max_cashiers", nullable = false)
    private Integer maxCashiers = 1; // Mặc định 1 Thu ngân
}
