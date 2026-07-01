package com.gara.notification_service.service;

import com.gara.notification_service.dto.NotificationEvent;
import com.gara.notification_service.dto.ScheduleNotificationEvent;
import com.gara.notification_service.entity.Notification;
import com.gara.notification_service.feign.CustomerClient;
import com.gara.notification_service.repository.NotificationRepository;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final CustomerClient customerClient;
    private final NotificationRepository notificationRepository;

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "notification.events.queue", durable = "true"),
            exchange = @Exchange(value = "notification.exchange", type = "topic"),
            key = "notification.#"
    ))
    public void handleNotificationEvent(NotificationEvent event) {
        log.info("Received notification event for customerId: {}", event.getCustomerId());

        try {
            // Save to DB
            Notification notifEntity = new Notification();
            notifEntity.setCustomerId(event.getCustomerId());
            notifEntity.setTitle(event.getTitle());
            notifEntity.setBody(event.getBody());

            if (event.getData() != null) {
                if (event.getData().containsKey("orderNumber")) {
                    notifEntity.setType("REPAIR");
                    notifEntity.setReferenceId(event.getData().get("orderNumber"));
                } else if (event.getData().containsKey("invoiceNumber")) {
                    notifEntity.setType("INVOICE");
                    notifEntity.setReferenceId(event.getData().get("invoiceNumber"));
                } else {
                    notifEntity.setType("LOYALTY");
                }
            } else {
                notifEntity.setType("GENERAL");
            }
            notificationRepository.save(notifEntity);

            // Get FCM Token from Customer Service
            String fcmToken = customerClient.getFcmToken(event.getCustomerId());

            if (!StringUtils.hasText(fcmToken)) {
                log.warn("No FCM token found for customerId: {}", event.getCustomerId());
                return;
            }

            // Build Firebase Message
            Message.Builder messageBuilder = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(com.google.firebase.messaging.Notification.builder()
                            .setTitle(event.getTitle())
                            .setBody(event.getBody())
                            .build());

            if (event.getData() != null && !event.getData().isEmpty()) {
                messageBuilder.putAllData(event.getData());
            }

            Message message = messageBuilder.build();

            // Send via Firebase Admin
            String response = FirebaseMessaging.getInstance().send(message);
            log.info("Successfully sent message: {}", response);

        } catch (Exception e) {
            log.error("Error processing notification event: {}", e.getMessage(), e);
        }
    }

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "gara.queue.schedule.notification", durable = "true"),
            exchange = @Exchange(value = "gara.exchange.notification", type = "direct"),
            key = "schedule.notify"
    ))
    public void handleScheduleEvent(ScheduleNotificationEvent event) {
        log.info("Received schedule event for userId: {}", event.getUserId());
        // For employees, we would normally get the FCM token for the employee's user ID here.
        // Assuming we have an employeeClient or we use customerClient if employees are also in there.
        // For demonstration, we just log it and save it.
        
        try {
            Notification notifEntity = new Notification();
            // We use customerId field to store userId for now (assuming same table structure)
            notifEntity.setCustomerId(event.getUserId()); 
            notifEntity.setTitle(event.getTitle());
            notifEntity.setBody(event.getBody());
            notifEntity.setType(event.getType());
            notificationRepository.save(notifEntity);
            
            log.info("Saved schedule notification to database for user: {}", event.getUserId());
            
            // TODO: Fetch employee FCM token and send via FirebaseMessaging
        } catch (Exception e) {
            log.error("Error processing schedule event: {}", e.getMessage(), e);
        }
    }
}
