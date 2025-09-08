package com.sweng.nota_bene.controller;

import java.security.Principal;
import java.util.Collections;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sweng.nota_bene.dto.LoginRequest;
import com.sweng.nota_bene.dto.RegisterRequest;
import com.sweng.nota_bene.dto.UserResponse;
import com.sweng.nota_bene.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) { 
        this.authService = authService; 
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req, HttpServletRequest request) {
        try {
            UserResponse user = authService.register(req);
            
            // Dopo la registrazione, effettua automaticamente il login
            authenticateUser(user, request);
            
            return ResponseEntity.ok(Map.of("success", true, "user", user));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req, HttpServletRequest request) {
        try {
            UserResponse user = authService.login(req);
            
            // Autentica l'utente nella sessione Spring Security
            authenticateUser(user, request);
            
            return ResponseEntity.ok(Map.of("success", true, "user", user));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/check")
    public ResponseEntity<?> checkAuth(Principal principal) {
        if (principal != null) {
            // Utente autenticato - recupera i dati dalla sessione
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UserResponse user = (UserResponse) auth.getPrincipal();
            return ResponseEntity.ok(Map.of("authenticated", true, "user", user));
        } else {
            return ResponseEntity.ok(Map.of("authenticated", false));
        }
    }
    
    /**
     * Il logout è gestito automaticamente da Spring Security
     * Questo endpoint non è necessario, ma lo lasciamo per compatibilità
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // Spring Security gestisce automaticamente il logout
        return ResponseEntity.ok(Map.of("success", true));
    }
    
    /**
     * Autentica l'utente nella sessione di Spring Security
     */
    private void authenticateUser(UserResponse user, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken authToken = 
            new UsernamePasswordAuthenticationToken(user, null, Collections.emptyList());
        
        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(authToken);
        SecurityContextHolder.setContext(securityContext);
        
        HttpSession session = request.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);
    }
}