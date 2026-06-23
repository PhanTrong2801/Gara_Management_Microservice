package com.gara.customer_service.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "customers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, unique = true, length = 15)
    private String phoneNumber;

    private String email;
    private String address;

    @Column(name = "user_id", unique = true)
    private Long userId;

    // Quan hệ 1-N: 1 Khách hàng có nhiều Xe
    // CascadeType.ALL: Khi xóa khách hàng thì xóa luôn xe của họ
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("customer")
    private List<Vehicle> vehicles;

    // Quan hệ 1-1: Mỗi khách hàng có 1 ví điểm
    @OneToOne(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    private CustomerLoyalty loyalty;
}
