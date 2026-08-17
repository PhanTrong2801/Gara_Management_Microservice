package com.gara.auth_service.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.TopicExchange;
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

    public static final String GARA_EXCHANGE = "gara_exchange";
    public static final String CUSTOMER_PROFILE_QUEUE = "gara.queue.customer.profile.updated";
    public static final String CUSTOMER_PROFILE_ROUTING_KEY = "customer.profile.updated.routing.key";

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
    public TopicExchange garaExchange() {
        return new TopicExchange(GARA_EXCHANGE);
    }

    @Bean
    public Queue customerProfileQueue() {
        return new Queue(CUSTOMER_PROFILE_QUEUE, true);
    }

    @Bean
    public Binding bindingCustomerProfileQueue(Queue customerProfileQueue, TopicExchange garaExchange) {
        return BindingBuilder.bind(customerProfileQueue).to(garaExchange).with(CUSTOMER_PROFILE_ROUTING_KEY);
    }

    @Bean
    public MessageConverter messageConverter() {
        return new JacksonJsonMessageConverter();
    }
}
