package com.gara.repair_service.service;

import com.gara.repair_service.dto.InventoryDeductEvent;
import com.gara.repair_service.dto.StockCheckRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "inventory-service", fallback = InventoryClientFallback.class)
public interface InventoryClient {

    @PostMapping("/api/inventory/parts/check-stock")
    String checkStock(@RequestBody StockCheckRequest request);
}
