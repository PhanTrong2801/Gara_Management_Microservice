package com.gara.customer_service.dto;

import lombok.Data;

@Data
public class InternalCustomerDTO {

    private Long userId;
    private String fullName;
    private String phoneNumber;
    private String email;
}
