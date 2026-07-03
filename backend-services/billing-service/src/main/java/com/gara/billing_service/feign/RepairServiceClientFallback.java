package com.gara.billing_service.feign;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class RepairServiceClientFallback implements RepairServiceClient {

    private static final Logger logger = LoggerFactory.getLogger(RepairServiceClientFallback.class);

    @Override
    public Map<String, Object> getRepairOrder(String orderNumber) {
        logger.error("CIRCUIT BREAKER OPEN/TIMEOUT: Không thể kết nối tới repair-service để lấy đơn hàng: {}", orderNumber);
        throw new RuntimeException("Dịch vụ Sửa chữa đang gián đoạn, không thể tính toán Hóa đơn lúc này. Vui lòng thử lại sau.");
    }
}
