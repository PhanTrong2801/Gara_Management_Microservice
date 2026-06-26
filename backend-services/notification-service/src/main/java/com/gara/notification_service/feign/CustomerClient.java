package com.gara.notification_service.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "customer-service")
public interface CustomerClient {

    @GetMapping("/api/customers/fcm-token/{customerId}")
    String getFcmToken(@PathVariable("customerId") Long customerId);
}
