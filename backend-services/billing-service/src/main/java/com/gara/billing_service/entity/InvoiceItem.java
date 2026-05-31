package com.gara.billing_service.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "invoice_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    @JsonIgnore
    private Invoice invoice;

    private String type; // TASK (Công thợ), PART (Phụ tùng)
    
    private String description; // Tên công việc hoặc Tên phụ tùng
    
    private Integer quantity; // Nếu là Task thì = 1
    
    private Double unitPrice;
    
    private Double totalPrice;
}
