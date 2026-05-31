package com.gara.repair_service.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RepairTask {
    private String name; // Tên công việc/dịch vụ (VD: Thay nhớt, Rửa xe)
    private Double cost; // Tiền công
    private Long mechanicId; // ID của thợ thực hiện (tùy chọn)
}
