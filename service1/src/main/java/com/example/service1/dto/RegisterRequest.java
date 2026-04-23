// dto/RegisterRequest.java
package com.example.service1.dto;

import com.example.service1.enums.Role;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String nom;
    private String prenom;
    private String email;
    private String password;
    private Role role;
    private String pieceIdentite;
}