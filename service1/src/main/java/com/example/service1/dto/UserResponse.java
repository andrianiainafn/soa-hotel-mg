// dto/UserResponse.java
package com.example.service1.dto;

import com.example.service1.enums.Role;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private Role role;
    private boolean actif;
    private String token;
}
