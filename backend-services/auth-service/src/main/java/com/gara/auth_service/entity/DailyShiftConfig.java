package com.gara.auth_service.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Data
@Table(name = "daily_shift_configs", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"shift_id", "work_date"})
})
@NoArgsConstructor
public class DailyShiftConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id", nullable = false)
    private Shift shift;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "max_mechanics", nullable = false)
    private Integer maxMechanics;

    @Column(name = "max_cashiers", nullable = false)
    private Integer maxCashiers;

    @Column(length = 255)
    private String note;
}
