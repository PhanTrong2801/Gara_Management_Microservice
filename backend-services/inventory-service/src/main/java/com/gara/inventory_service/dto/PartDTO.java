package com.gara.inventory_service.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PartDTO {

    @NotBlank(message = "Mã phụ tùng không được để trống")
    private String partCode;

    @NotBlank(message = "Tên phụ tùng không được để trống")
    private String name;

    private String description;

    @NotNull(message = "Giá bán không được để trống")
    @Min(value = 0, message = "Giá bán phải lớn hơn hoặc bằng 0")
    private Double price;

    @NotNull(message = "Số lượng tồn kho không được để trống")
    @Min(value = 0, message = "Số lượng tồn kho không được âm")
    private Integer stockQuantity;

    @Min(value = 0, message = "Mức tồn kho tối thiểu không được âm")
    private Integer minStockLevel = 5;

    @NotNull(message = "ID nhà cung cấp không được để trống")
    private Long supplierId;
}