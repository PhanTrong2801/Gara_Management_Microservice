package com.gara.auth_service.client;

import com.gara.auth_service.dto.InternalCustomerDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class CustomerServiceClientFallback implements CustomerServiceClient {

    private static final Logger logger = LoggerFactory.getLogger(CustomerServiceClientFallback.class);

    @Override
    public void createInternalCustomer(InternalCustomerDTO dto) {
        logger.error("CIRCUIT BREAKER OPEN/TIMEOUT: Không thể tạo Customer record bên customer-service cho userId: {}", dto.getUserId());
        throw new RuntimeException("Không thể kết nối đến Dịch vụ Khách hàng. Quá trình tạo hồ sơ thất bại.");
    }
}
