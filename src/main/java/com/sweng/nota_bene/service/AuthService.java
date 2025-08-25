package com.sweng.nota_bene.service;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sweng.nota_bene.dto.LoginRequest;
import com.sweng.nota_bene.dto.RegisterRequest;
import com.sweng.nota_bene.dto.UserResponse;
import com.sweng.nota_bene.model.Utente;
import com.sweng.nota_bene.repository.UserRepository;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;

    public AuthService(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @Transactional
    public UserResponse register(RegisterRequest req) {
        if (users.existsByEmail(req.email()))
            throw new IllegalArgumentException("Email già utilizzata");
        if (users.existsByNickname(req.nickname()))
            throw new IllegalArgumentException("Nickname già utilizzato");

        Utente u = new Utente();
        u.setEmail(req.email().trim().toLowerCase());
        u.setNickname(req.nickname().trim());
        u.setPasswordHash(encoder.encode(req.password()));
        users.save(u);

        return new UserResponse(u.getEmail(), u.getNickname());
    }

    @Transactional(readOnly = true)
    public UserResponse login(LoginRequest req) {
        Utente u = users.findByNickname(req.nickname().trim())
                .orElseThrow(() -> new BadCredentialsException("Credenziali non valide"));
        if (!encoder.matches(req.password(), u.getPasswordHash())) {
            throw new BadCredentialsException("Credenziali non valide");
        }
        return new UserResponse(u.getEmail(), u.getNickname());
    }
}