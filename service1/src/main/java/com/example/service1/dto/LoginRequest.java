// dto/LoginRequest.java
package com.example.service1.dto;
import lombok.*;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    private String email;
    private String password;
}