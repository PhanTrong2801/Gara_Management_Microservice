package com.gara.auth_service.dto;

import lombok.Data;
import java.time.LocalTime;

@Data
public class ShiftDto {
    private Long id;
    private String shiftName;
    private LocalTime startTime;
    private LocalTime endTime;
    private String description;
    private Integer maxMechanics;
    private Integer maxCashiers;
}
