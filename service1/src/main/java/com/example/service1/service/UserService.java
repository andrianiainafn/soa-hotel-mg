package com.example.service1.service;

import com.example.service1.config.JwtUtil;
import com.example.service1.dto.*;
import com.example.service1.entity.User;
import com.example.service1.enums.Role;
import com.example.service1.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // Créer un utilisateur
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email déjà utilisé");
        }

        User user = User.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .pieceIdentite(request.getPieceIdentite())
                .actif(true)
                .build();

        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    // Login with JWT token generation
    public UserResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Mot de passe incorrect");
        }

        if (!user.isActif()) {
            throw new RuntimeException("Compte désactivé");
        }

        // Generate JWT token
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        return toResponse(user, token);
    }

    // Récupérer tous les utilisateurs
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // Récupérer par rôle
    public List<UserResponse> getUsersByRole(Role role) {
        return userRepository.findByRole(role)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // Récupérer par ID
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        return toResponse(user);
    }

    // Désactiver un compte
    public UserResponse deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        user.setActif(false);
        return toResponse(userRepository.save(user));
    }

    // Convertir User -> UserResponse (without token)
    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .role(user.getRole())
                .actif(user.isActif())
                .build();
    }

    // Convertir User -> UserResponse (with token)
    private UserResponse toResponse(User user, String token) {
        return UserResponse.builder()
                .id(user.getId())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .role(user.getRole())
                .actif(user.isActif())
                .token(token)
                .build();
    }
    
    public List<UserResponse> searchByEmail(String email) {
    return userRepository.findByEmailContainingIgnoreCase(email)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
}
}