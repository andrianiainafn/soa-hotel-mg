package com.example.service1.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class RoomCleanedMessageHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @RabbitListener(queues = RabbitMQConfig.ROOM_CLEANED_QUEUE)
    public void handleMessage(String message) {
        log.info("Received ROOM_CLEANED event: {}", message);
        try {
            JsonNode jsonMessage = objectMapper.readValue(message, JsonNode.class);
            String roomId = jsonMessage.has("roomId") ? jsonMessage.get("roomId").asText() : null;
            String status = jsonMessage.has("status") ? jsonMessage.get("status").asText() : null;
            
            log.info("Processing room update - Room ID: {}, Status: {}", roomId, status);
            
            if ("available".equalsIgnoreCase(status)) {
                log.info("Room {} is now available after cleaning", roomId);
                // Here you could call a service to update room status in your system
                // For example, if service1 maintains room state, update it here
            }
            
        } catch (Exception e) {
            log.error("Error processing ROOM_CLEANED message: {}", e.getMessage(), e);
        }
    }
}
