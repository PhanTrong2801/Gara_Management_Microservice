package com.gara.notification_service.feign;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class CustomerClientFallback implements CustomerClient {

    private static final Logger logger = LoggerFactory.getLogger(CustomerClientFallback.class);

    @Override
    public String getFcmToken(Long customerId) {
        logger.error("CIRCUIT BREAKER OPEN/TIMEOUT: Không thể lấy FCM Token cho khách hàng {}. Dịch vụ customer-service có thể đang gián đoạn.", customerId);
        // Trả về null để notification-service bỏ qua việc gửi thông báo FCM thay vì bị crash.
        return null;
    }
}
