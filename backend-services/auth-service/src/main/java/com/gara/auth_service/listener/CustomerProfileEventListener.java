package com.gara.auth_service.listener;

import com.gara.auth_service.config.RabbitMQConfig;
import com.gara.auth_service.dto.CustomerProfileUpdatedEvent;
import com.gara.auth_service.entity.User;
import com.gara.auth_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomerProfileEventListener {

    private final UserRepository userRepository;

    @RabbitListener(queues = RabbitMQConfig.CUSTOMER_PROFILE_QUEUE)
    @Transactional
    public void handleCustomerProfileUpdated(CustomerProfileUpdatedEvent event) {
        log.info("Received CustomerProfileUpdatedEvent for userId: {}", event.getUserId());
        
        if (event.getUserId() == null) {
            log.warn("UserId is null in the event, skipping.");
            return;
        }

        userRepository.findById(event.getUserId()).ifPresent(user -> {
            user.setFullName(event.getFullName());
            userRepository.save(user);
            log.info("Successfully updated user {} with new full_name: {}", user.getId(), event.getFullName());
        });
    }
}
