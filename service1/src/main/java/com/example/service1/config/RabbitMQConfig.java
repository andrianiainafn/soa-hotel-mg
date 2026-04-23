package com.example.service1.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.listener.SimpleMessageListenerContainer;
import org.springframework.amqp.rabbit.listener.adapter.MessageListenerAdapter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String ROOM_CLEANED_QUEUE = "room.cleaned.queue";
    public static final String ROOM_CLEANED_EXCHANGE = "room.events.exchange";
    public static final String ROOM_CLEANED_ROUTING_KEY = "room.cleaned";

    @Bean
    public Queue roomCleanedQueue() {
        return new Queue(ROOM_CLEANED_QUEUE, true);
    }

    @Bean
    public TopicExchange roomEventsExchange() {
        return new TopicExchange(ROOM_CLEANED_EXCHANGE);
    }

    @Bean
    public Binding roomCleanedBinding(Queue roomCleanedQueue, TopicExchange roomEventsExchange) {
        return BindingBuilder
                .bind(roomCleanedQueue)
                .to(roomEventsExchange)
                .with(ROOM_CLEANED_ROUTING_KEY);
    }

    @Bean
    public SimpleMessageListenerContainer container(ConnectionFactory connectionFactory,
                                                    MessageListenerAdapter roomCleanedListenerAdapter) {
        SimpleMessageListenerContainer container = new SimpleMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.setQueueNames(ROOM_CLEANED_QUEUE);
        container.setMessageListener(roomCleanedListenerAdapter);
        return container;
    }

    @Bean
    public MessageListenerAdapter roomCleanedListenerAdapter(RoomCleanedMessageHandler handler) {
        return new MessageListenerAdapter(handler, "handleMessage");
    }
}