package com.gara.billing_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String invoiceNumber; // Ví dụ: INV-2026-0001

    @Column(nullable = false)
    private String repairOrderNumber; // Liên kết với phiếu sửa chữa bên repair-service

    private Long customerId; // Lấy từ repair order

    private Double totalLaborCost; // Tổng tiền công
    private Double totalPartCost;  // Tổng tiền phụ tùng
    private Double totalAmount;    // Tổng tiền thanh toán (labor + part)

    @Column(nullable = false)
    private String status; // UNPAID, PAID, CANCELLED

    private String paymentMethod; // CASH, TRANSFER, CARD

    private LocalDateTime createdAt;
    private LocalDateTime paidAt;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InvoiceItem> items = new ArrayList<>();

    public void addItem(InvoiceItem item) {
        items.add(item);
        item.setInvoice(this);
    }
}
