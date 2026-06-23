package com.gara.customer_service.listener;

import com.gara.customer_service.dto.AddPointsRequest;
import com.gara.customer_service.event.InvoicePaidEvent;
import com.gara.customer_service.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class LoyaltyEventListener {

    private final LoyaltyService loyaltyService;

    @RabbitListener(queues = "${rabbitmq.queue.loyalty:loyalty_queue}")
    public void handleInvoicePaidEvent(InvoicePaidEvent event) {
        log.info("Received InvoicePaidEvent: {}", event);
        try {
            AddPointsRequest request = new AddPointsRequest();
            request.setAmountSpent(event.getAmountPaid());
            request.setDescription("Thanh toán hóa đơn: " + event.getInvoiceCode());
            
            loyaltyService.addPointsFromSpent(event.getCustomerId(), request);
            log.info("Successfully added points for customer: {}", event.getCustomerId());
        } catch (Exception e) {
            log.error("Failed to add points for customer: {}. Error: {}", event.getCustomerId(), e.getMessage());
            // Có thể thêm logic lưu vào bảng dead-letter queue hoặc retry ở đây nếu cần.
        }
    }
}
