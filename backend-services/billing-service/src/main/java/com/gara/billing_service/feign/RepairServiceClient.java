package com.gara.billing_service.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

// Chúng ta sử dụng Map để nhận dynamic JSON từ RepairService (MongoDB)
@FeignClient(name = "repair-service", fallback = RepairServiceClientFallback.class)
public interface RepairServiceClient {

    @GetMapping("/api/repair/orders/{orderNumber}")
    Map<String, Object> getRepairOrder(@PathVariable("orderNumber") String orderNumber);
}
