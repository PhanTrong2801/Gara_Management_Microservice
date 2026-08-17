package com.gara.customer_service.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${rabbitmq.queue.loyalty:loyalty_queue}")
    private String queue;

    @Value("${rabbitmq.exchange.name:gara_exchange}")
    private String exchange;

    @Value("${rabbitmq.routing.key.loyalty:invoice.paid.routing.key}")
    private String routingKey;

    @Value("${rabbitmq.routing.key.customer.profile.updated:customer.profile.updated.routing.key}")
    private String routingKeyProfileUpdated;

    @Bean
    public Queue queue() {
        return new Queue(queue);
    }

    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(exchange);
    }

    @Bean
    public Binding binding() {
        return BindingBuilder.bind(queue())
                .to(exchange())
                .with(routingKey);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }
}
