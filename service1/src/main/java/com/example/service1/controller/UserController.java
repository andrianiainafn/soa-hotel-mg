package com.example.service1.controller;

import com.example.service1.dto.*;
import com.example.service1.enums.Role;
import com.example.service1.service.UserService;
import com.example.service1.service.RabbitMQService;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final RabbitMQService rabbitMQService;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.status(201).body(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserResponse>> getUsersByRole(@PathVariable Role role) {
        return ResponseEntity.ok(userService.getUsersByRole(role));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<UserResponse> deactivateUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.deactivateUser(id));
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(java.util.Map.of("status", "UP", "service", "service1-java"));
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> searchByEmail(@RequestParam String email) {
        return ResponseEntity.ok(userService.searchByEmail(email));
    }
    @PostMapping("/verify-identity")
    public ResponseEntity<?> verifyIdentity(@RequestBody IdVerificationRequest request) {
        // This is a simplified implementation
        // In a real system, you would:
        // 1. Validate the pieceIdentite format
        // 2. Check against a database of valid IDs
        // 3. Possibly integrate with an external ID verification service
        // 4. Check if the reservation exists and matches the user
        
        if (request.getPieceIdentite() == null || request.getPieceIdentite().trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Piece d'identité requise"));
        }
        
        // For now, just validate that it's not empty
        boolean isValid = request.getPieceIdentite().length() >= 5;
        
        if (isValid) {
            // Publier l'événement d'utilisateur vérifié via RabbitMQ
            // Cet événement sera consommé par service2 pour mettre à jour la réservation
            rabbitMQService.publishUserVerified(
                request.getUserId() != null ? request.getUserId() : 0L,
                request.getEmail() != null ? request.getEmail() : "",
                request.getPieceIdentite()
            );
            
            return ResponseEntity.ok(Map.of(
                "status", "VERIFIED",
                "message", "Pièce d'identité validée avec succès"
            ));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Pièce d'identité invalide"));
        }
    }
}