package com.gara.repair_service.dto;

import com.gara.repair_service.entity.RepairPart;
import com.gara.repair_service.entity.RepairTask;
import lombok.Data;

import java.util.List;

@Data
public class RepairDetailsDTO {
    private List<RepairTask> tasks;
    private List<RepairPart> parts;
}
