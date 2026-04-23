package com.example.service1.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

// @Bean
// public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
//     http
//         // 1. Activer le support CORS de Spring Security
//         // .cors(cors -> cors.configurationSource(request -> {
//         //     var corsConfiguration = new org.springframework.web.cors.CorsConfiguration();
//         //     corsConfiguration.setAllowedOrigins(java.util.List.of("http://localhost:3000"));
//         //     corsConfiguration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
//         //     corsConfiguration.setAllowedHeaders(java.util.List.of("*"));
//         //     corsConfiguration.setAllowCredentials(true);
//         //     return corsConfiguration;
//         // }))
//         .csrf(csrf -> csrf.disable())
//         .authorizeHttpRequests(auth -> auth
//             .requestMatchers("/users/register", "/users/login", "/users/health").permitAll()
//             .requestMatchers("/users/**").hasRole("ADMIN")
//             .anyRequest().authenticated()
//         )
//         .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

//     return http.build();
// }
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .cors(cors -> cors.disable())      // pas de CORS dans service1
        .csrf(csrf -> csrf.disable())
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()  // ← CRUCIAL
            .requestMatchers("/users/register", "/users/login", "/users/health", "/users/search").permitAll()
            .requestMatchers("/users/**").hasRole("ADMIN")
            .anyRequest().authenticated()
        )
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
}
}

