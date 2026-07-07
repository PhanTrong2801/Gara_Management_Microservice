package com.gara.auth_service.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class DailyShiftConfigDto {
    private Long id;
    private Long shiftId;
    private LocalDate workDate;
    private Integer maxMechanics;
    private Integer maxCashiers;
    private String note;
}
