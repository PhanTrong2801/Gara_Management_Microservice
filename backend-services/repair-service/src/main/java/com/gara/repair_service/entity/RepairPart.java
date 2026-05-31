package com.gara.repair_service.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RepairPart {
    private Long partId; // ID phụ tùng lấy từ inventory-service
    private String partName; // Tên phụ tùng để hiển thị nhanh
    private Integer quantity; // Số lượng sử dụng
    private Double unitPrice; // Đơn giá tại thời điểm thay thế
}
