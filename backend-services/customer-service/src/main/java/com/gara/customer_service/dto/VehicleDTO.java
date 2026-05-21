package com.gara.customer_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class VehicleDTO {
    @NotBlank(message = "Biển số xe không được để trống")
    private String licensePlate;

    private String vin;
    private String brand;
    private String model;
    private Integer year;

    @NotNull(message = "Mã khách hàng sở hữu không được để trống")
    private Long customerId; // Liên kết xe với chủ qua ID
}