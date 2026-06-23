package com.gara.customer_service.entity;

import com.gara.customer_service.entity.enums.Tier;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "customer_loyalty")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerLoyalty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "customer_id", nullable = false, unique = true)
    @JsonIgnore
    private Customer customer;

    @Column(nullable = false)
    private Integer totalPoints = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Tier tier = Tier.BRONZE;

    @Column(nullable = false)
    private Double totalSpent = 0.0;
}
