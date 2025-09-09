package com.sweng.nota_bene.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;

@Configuration
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/",
                    "/css/**",
                    "/js/**", 
                    "/images/**",
                    "/home",  
                    "/form"  
                ).permitAll()
                .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
                .requestMatchers("/api/auth/check").permitAll() 
                .requestMatchers("/api/**").authenticated() 
                .anyRequest().authenticated()
            )
            .formLogin(form -> form.disable()) 
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout") 
                .logoutSuccessHandler(customLogoutSuccessHandler())
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
            )
            .sessionManagement(session -> session
                .maximumSessions(1) // Un utente può avere solo una sessione attiva
                .maxSessionsPreventsLogin(false) // La nuova sessione sostituisce la vecchia
            );
        
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public LogoutSuccessHandler customLogoutSuccessHandler() {
        return (request, response, authentication) -> {
            response.setStatus(200);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\": true, \"message\": \"Logout effettuato con successo\"}");
        };
    }
}