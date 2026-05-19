package com.gara.repair_service.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "repair_orders")
@Data
@NoArgsConstructor
public class RepairOrder {

    private String id; // MongoDB tự sinh chuỗi hex ObjectId ngẫu nhiên
    private String orderNumber; // Mã phiếu, ví dụ: RO-2026-0001
    private Long carId;        // Lưu ID xe từ Customer Service (MySQL)
    private Long customerId;   // Lưu ID khách từ Customer Service (MySQL)
    private String status;     // PENDING, DIAGNOSING, QUOTING, REPAIRING, COMPLETED
    private Long advisorId;    // ID của Lễ tân tiếp nhận
    private Long mechanicId;   // ID của Thợ máy (Manager gán)

    private Map<String, Object> checkInInfo; // Lưu thông tin linh hoạt (Odo, mức xăng, vết trầy xước)
    private LocalDateTime createdAt = LocalDateTime.now();
}
