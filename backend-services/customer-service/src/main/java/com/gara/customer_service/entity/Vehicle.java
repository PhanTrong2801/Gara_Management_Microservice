package com.gara.customer_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;

@Entity
@Table(name = "vehicles", indexes = {
    @Index(name = "idx_vehicle_license_plate", columnList = "licensePlate"),
    @Index(name = "idx_vehicle_customer", columnList = "customer_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String licensePlate;

    @Column(unique = true, length = 50)
    private String vin; // Số khung (Vehicle Identification Number)

    private String brand; // Hãng xe (VD: Toyota, Ford...)
    private String model; // Dòng xe (VD: Camry, Ranger...)
    private Integer year; // Năm sản xuất

    // Quan hệ N-1: Nhiều Xe thuộc về 1 Khách hàng
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;
}
