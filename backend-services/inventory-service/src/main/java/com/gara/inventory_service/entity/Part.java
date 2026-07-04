package com.gara.inventory_service.entity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "parts", indexes = {
    @Index(name = "idx_part_name", columnList = "name"),
    @Index(name = "idx_part_code", columnList = "partCode")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Part {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String partCode; // Mã phụ tùng (VD: PT-001, OIL-CAS)

    @Column(nullable = false, length = 150)
    private String name; // Tên phụ tùng

    private String description; // Mô tả thêm (VD: Nhớt tổng hợp 10W-40)

    @Column(nullable = false)
    private Double price; // Giá bán ra cho khách

    @Column(nullable = false)
    private Integer stockQuantity; // Số lượng tồn kho hiện tại (Cực kỳ quan trọng)

    @Column(name = "min_stock_level", nullable = false)
    private Integer minStockLevel = 5; // Mức tồn kho tối thiểu để cảnh báo

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier; // Nhà cung cấp
}
