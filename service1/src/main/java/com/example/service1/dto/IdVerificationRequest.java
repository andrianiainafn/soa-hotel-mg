package com.example.service1.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdVerificationRequest {
    private String pieceIdentite;
    private String reservationId;
    private Long userId;
    private String email;
}
