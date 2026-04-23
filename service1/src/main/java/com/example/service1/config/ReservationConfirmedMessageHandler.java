package com.example.service1.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class ReservationConfirmedMessageHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @RabbitListener(queues = RabbitMQProducerConfig.RESERVATION_CONFIRMED_QUEUE)
    public void handleReservationConfirmed(String message) {
        log.info("Received RESERVATION_CONFIRMED event: {}", message);
        try {
            JsonNode jsonMessage = objectMapper.readValue(message, JsonNode.class);
            String reservationId = jsonMessage.has("reservationId") ? jsonMessage.get("reservationId").asText() : null;
            String clientId = jsonMessage.has("clientId") ? jsonMessage.get("clientId").asText() : null;
            String chambreId = jsonMessage.has("chambreId") ? jsonMessage.get("chambreId").asText() : null;
            String statut = jsonMessage.has("statut") ? jsonMessage.get("statut").asText() : null;
            
            log.info("Processing reservation confirmation - Reservation ID: {}, Client ID: {}, Room ID: {}, Status: {}", 
                     reservationId, clientId, chambreId, statut);
            
            if ("confirmee".equalsIgnoreCase(statut)) {
                log.info("Reservation {} is now confirmed for client {}", reservationId, clientId);
                // Ici, on pourrait :
                // 1. Vérifier que le client existe dans la base de données
                // 2. Lier la réservation au compte client
                // 3. Envoyer une notification au client
            }
            
        } catch (Exception e) {
            log.error("Error processing RESERVATION_CONFIRMED message: {}", e.getMessage(), e);
        }
    }
}