package com.gara.repair_service.service;

import com.gara.repair_service.dto.StockCheckRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class InventoryClientFallback implements InventoryClient {

    private static final Logger logger = LoggerFactory.getLogger(InventoryClientFallback.class);

    @Override
    public String checkStock(StockCheckRequest request) {
        logger.error("CIRCUIT BREAKER OPEN/TIMEOUT: Không thể kiểm tra kho cho các phụ tùng. Trả về trạng thái dự phòng.");
        return "SERVICE_UNAVAILABLE";
    }
}
