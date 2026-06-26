package com.gara.customer_service.listener;

import com.gara.customer_service.dto.AddPointsRequest;
import com.gara.customer_service.dto.CustomerLoyaltyDto;
import com.gara.customer_service.entity.Customer;
import com.gara.customer_service.event.InvoicePaidEvent;
import com.gara.customer_service.service.CustomerService;
import com.gara.customer_service.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import java.util.HashMap;
import java.util.Map;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class LoyaltyEventListener {

    private final LoyaltyService loyaltyService;
    private final CustomerService customerService;
    private final RabbitTemplate rabbitTemplate;

    @RabbitListener(queues = "${rabbitmq.queue.loyalty:loyalty_queue}")
    public void handleInvoicePaidEvent(InvoicePaidEvent event) {
        log.info("Received InvoicePaidEvent: {}", event);
        try {
            AddPointsRequest request = new AddPointsRequest();
            request.setAmountSpent(event.getAmountPaid());
            request.setDescription("Thanh toán hóa đơn: " + event.getInvoiceCode());
            
            CustomerLoyaltyDto newLoyalty = loyaltyService.addPointsFromSpent(event.getCustomerId(), request);
            log.info("Successfully added points for customer: {}", event.getCustomerId());

            // Gửi thông báo đẩy
            try {
                Customer customer = customerService.getCustomerById(event.getCustomerId());
                if (customer.getFcmToken() != null && !customer.getFcmToken().isEmpty()) {
                    String title = "Tích điểm thành công \uD83C\uDF89";
                    String body = String.format("Bạn vừa được cộng điểm từ hóa đơn %s. Tổng điểm hiện tại: %d điểm (Hạng %s).",
                            event.getInvoiceCode(), newLoyalty.getTotalPoints(), newLoyalty.getTier());
                    
                    Map<String, Object> notifEvent = new HashMap<>();
                    notifEvent.put("customerId", event.getCustomerId());
                    notifEvent.put("title", title);
                    notifEvent.put("body", body);
                    rabbitTemplate.convertAndSend("notification.exchange", "notification.loyalty", notifEvent);
                }
            } catch (Exception e) {
                log.error("Failed to send push notification to customer {}: {}", event.getCustomerId(), e.getMessage());
            }

        } catch (Exception e) {
            log.error("Failed to add points for customer: {}. Error: {}", event.getCustomerId(), e.getMessage());
            // Có thể thêm logic lưu vào bảng dead-letter queue hoặc retry ở đây nếu cần.
        }
    }
}
