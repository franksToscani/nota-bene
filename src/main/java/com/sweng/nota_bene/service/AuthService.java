package com.sweng.nota_bene.service;

import com.sweng.nota_bene.dto.RegisterRequest;
import com.sweng.nota_bene.dto.UserResponse;
import com.sweng.nota_bene.model.User;
import com.sweng.nota_bene.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        User u = new User();
        u.setEmail(req.email().trim().toLowerCase());
        u.setNickname(req.nickname().trim());
        u.setPasswordHash(encoder.encode(req.password()));
        users.save(u);

        return new UserResponse(u.getId(), u.getNickname());
    }
}
