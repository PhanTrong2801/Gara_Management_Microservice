package com.gara.repair_service.dto;

import lombok.Data;

import java.util.Map;

@Data
public class CreateRepairOrderDTO {

    private Long carId;         // ID xe từ hệ thống MySQL khách hàng
    private Long customerId;    // ID chủ xe
    private Map<String, Object> checkInInfo; // Các thông tin linh hoạt: odo, mức xăng, vết xước...
}
