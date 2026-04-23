package com.example.service1.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQProducerConfig {

    public static final String USER_VERIFIED_QUEUE = "service1.user.verified";
    public static final String USER_EVENTS_EXCHANGE = "user.events.exchange";
    public static final String USER_VERIFIED_ROUTING_KEY = "user.verified";

    public static final String RESERVATION_EVENTS_EXCHANGE = "reservation.events.exchange";
    public static final String RESERVATION_CONFIRMED_QUEUE = "service2.reservation.confirmed";

    @Bean
    public Queue userVerifiedQueue() {
        return new Queue(USER_VERIFIED_QUEUE, true);
    }

    @Bean
    public TopicExchange userEventsExchange() {
        return new TopicExchange(USER_EVENTS_EXCHANGE);
    }

    @Bean
    public Binding userVerifiedBinding(Queue userVerifiedQueue, TopicExchange userEventsExchange) {
        return BindingBuilder
                .bind(userVerifiedQueue)
                .to(userEventsExchange)
                .with(USER_VERIFIED_ROUTING_KEY);
    }

    @Bean
    public Queue reservationConfirmedQueue() {
        return new Queue(RESERVATION_CONFIRMED_QUEUE, true);
    }

    @Bean
    public TopicExchange reservationEventsExchange() {
        return new TopicExchange(RESERVATION_EVENTS_EXCHANGE);
    }

    @Bean
    public Binding reservationConfirmedBinding(Queue reservationConfirmedQueue, TopicExchange reservationEventsExchange) {
        return BindingBuilder
                .bind(reservationConfirmedQueue)
                .to(reservationEventsExchange)
                .with("reservation.confirmed");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }
}