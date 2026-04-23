package com.example.service1.service;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class RabbitMQService {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    // Publier un événement d'utilisateur vérifié
    public void publishUserVerified(Long userId, String email, String pieceIdentite) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", "USER_VERIFIED");
        message.put("userId", userId);
        message.put("email", email);
        message.put("pieceIdentite", pieceIdentite);
        message.put("timestamp", System.currentTimeMillis());

        rabbitTemplate.convertAndSend(
            "user.events.exchange",
            "user.verified",
            message
        );
    }

    // Publier un événement de chambre nettoyée
    public void publishRoomCleaned(String roomId, String roomNumber) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", "ROOM_CLEANED");
        message.put("roomId", roomId);
        message.put("roomNumber", roomNumber);
        message.put("status", "available");
        message.put("timestamp", System.currentTimeMillis());

        rabbitTemplate.convertAndSend(
            "reservation.events.exchange",
            "room.cleaned",
            message
        );
    }
}