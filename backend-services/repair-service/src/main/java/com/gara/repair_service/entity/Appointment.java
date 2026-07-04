package com.gara.repair_service.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "appointments")
@Data
@NoArgsConstructor
public class Appointment {
    
    @Id
    private String id;
    
    @Indexed
    private Long customerId;
    private Long carId;
    
    private LocalDateTime appointmentDate;
    private String description;
    
    // PENDING (Chờ xác nhận), CONFIRMED (Đã xác nhận), CANCELLED (Đã hủy), COMPLETED (Đã hoàn thành)
    @Indexed
    private String status = "PENDING";
    
    private LocalDateTime createdAt = LocalDateTime.now();
}
