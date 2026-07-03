package com.gara.auth_service.client;

import com.gara.auth_service.dto.InternalCustomerDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "customer-service", path = "/api/customers", fallback = CustomerServiceClientFallback.class)
public interface CustomerServiceClient {

    @PostMapping("/internal")
    void createInternalCustomer(@RequestBody InternalCustomerDTO dto);
}
