package com.sweng.nota_bene.service;

import com.sweng.nota_bene.dto.LoginRequest;
import com.sweng.nota_bene.dto.RegisterRequest;
import com.sweng.nota_bene.dto.UserResponse;
import com.sweng.nota_bene.model.Utente;
import com.sweng.nota_bene.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setup() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        authService = new AuthService(userRepository, passwordEncoder);
    }

    @Test
    void register_success() {
        RegisterRequest req = new RegisterRequest("test@example.com", "nickname", "password123");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.existsByNickname("nickname")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashedPassword");

        UserResponse res = authService.register(req);

        assertEquals("nickname", res.nickname());
        assertEquals("test@example.com", res.email());
        verify(userRepository, times(1)).save(any(Utente.class));
    }

    @Test
    void register_emailAlreadyExists() {
        RegisterRequest req = new RegisterRequest("test@example.com", "nickname", "password123");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        IllegalArgumentException ex =
                assertThrows(IllegalArgumentException.class, () -> authService.register(req));
        assertEquals("Email già utilizzata", ex.getMessage());
    }

    @Test
    void register_nicknameAlreadyExists() {
        RegisterRequest req = new RegisterRequest("test@example.com", "nickname", "password123");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.existsByNickname("nickname")).thenReturn(true);

        IllegalArgumentException ex =
                assertThrows(IllegalArgumentException.class, () -> authService.register(req));
        assertEquals("Nickname già utilizzato", ex.getMessage());
    }

    @Test
    void login_success() {
        Utente u = new Utente();
        u.setEmail("test@example.com");
        u.setNickname("nickname");
        u.setPasswordHash("hashedPassword");

        when(userRepository.findByNickname("nickname")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("password123", "hashedPassword")).thenReturn(true);

        LoginRequest req = new LoginRequest("nickname", "password123");
        UserResponse res = authService.login(req);

        assertEquals("nickname", res.nickname());
        assertEquals("test@example.com", res.email());
    }

    @Test
    void login_invalidNickname() {
        when(userRepository.findByNickname("nickname")).thenReturn(Optional.empty());

        LoginRequest req = new LoginRequest("nickname", "password123");

        assertThrows(BadCredentialsException.class, () -> authService.login(req));
    }

    @Test
    void login_wrongPassword() {
        Utente u = new Utente();
        u.setNickname("nickname");
        u.setPasswordHash("hashedPassword");

        when(userRepository.findByNickname("nickname")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("wrongpass", "hashedPassword")).thenReturn(false);

        LoginRequest req = new LoginRequest("nickname", "wrongpass");

        assertThrows(BadCredentialsException.class, () -> authService.login(req));
    }
}
