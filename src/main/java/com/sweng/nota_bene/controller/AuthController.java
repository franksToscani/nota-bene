package com.sweng.nota_bene.controller;

import com.sweng.nota_bene.dto.RegisterRequest;
import com.sweng.nota_bene.dto.UserResponse;
import com.sweng.nota_bene.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) { this.auth = auth; }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        UserResponse user = auth.register(req);
        // Risposta compatibile col nostro JS: { success: true, user: { id, nickname } }
        return ResponseEntity.ok(Map.of("success", true, "user", user));
    }
}
