package com.gara.repair_service.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "service_catalog")
@Data
@NoArgsConstructor
public class ServiceCatalog {
    @Id
    private String id;
    
    @Indexed
    private String name; // Tên dịch vụ (Rửa xe, Thay nhớt...)
    private Double defaultCost; // Giá niêm yết
    private String description; // Mô tả
}
