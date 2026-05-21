package com.gara.customer_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CustomerDTO {
    @NotBlank(message = "Tên khách hàng không được để trống")
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Size(min = 10, max = 11, message = "Số điện thoại phải từ 10 đến 11 số")
    private String phoneNumber;

    private String email;
    private String address;
}