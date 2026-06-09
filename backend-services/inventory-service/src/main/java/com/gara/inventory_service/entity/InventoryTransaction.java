package com.gara.inventory_service.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_transactions")
@Data
public class InventoryTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "part_id", nullable = false)
    private Part part;

    @Column(nullable = false)
    private String transactionType; // IMPORT_PO, EXPORT_REPAIR, MANUAL_ADJUST

    @Column(nullable = false)
    private int quantity; // Số lượng thay đổi (dương là nhập, âm là xuất)

    private String reference; // PO-001, REPAIR-005, hoặc Lý do do người dùng nhập

    @Column(nullable = false)
    private LocalDateTime transactionDate;
}
