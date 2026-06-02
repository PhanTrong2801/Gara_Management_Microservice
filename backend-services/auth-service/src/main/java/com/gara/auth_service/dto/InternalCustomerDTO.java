package com.gara.auth_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InternalCustomerDTO {
    private Long userId;
    private String fullName;
    private String phoneNumber;
    private String email;
}
