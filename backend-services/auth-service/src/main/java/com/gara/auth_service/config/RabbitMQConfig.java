package com.gara.auth_service.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "gara.exchange.notification";
    public static final String SCHEDULE_QUEUE = "gara.queue.schedule.notification";
    public static final String SCHEDULE_ROUTING_KEY = "schedule.notify";

    @Bean
    public DirectExchange notificationExchange() {
        return new DirectExchange(EXCHANGE_NAME);
    }

    @Bean
    public Queue scheduleQueue() {
        return new Queue(SCHEDULE_QUEUE, true);
    }

    @Bean
    public Binding bindingScheduleQueue(Queue scheduleQueue, DirectExchange notificationExchange) {
        return BindingBuilder.bind(scheduleQueue).to(notificationExchange).with(SCHEDULE_ROUTING_KEY);
    }

    @Bean
    public MessageConverter messageConverter() {
        return new JacksonJsonMessageConverter();
    }
}
