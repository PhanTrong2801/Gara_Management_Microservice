package com.gara.customer_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "loyalty_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltySettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Double vndPerPoint = 100000.0; // Mặc định 100,000đ = 1 điểm

    @Column(nullable = false)
    private Integer silverThreshold = 100;

    @Column(nullable = false)
    private Integer goldThreshold = 500;

    @Column(nullable = false)
    private Integer platinumThreshold = 2000;
}
