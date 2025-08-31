package com.sweng.nota_bene;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.sweng.nota_bene.dto.LoginRequest;
import com.sweng.nota_bene.dto.RegisterRequest;
import com.sweng.nota_bene.dto.UserResponse;
import com.sweng.nota_bene.model.Utente;
import com.sweng.nota_bene.repository.UserRepository;
import com.sweng.nota_bene.service.AuthService;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    
    @Mock
    private PasswordEncoder passwordEncoder;
    
    @InjectMocks
    private AuthService authService;

    @Test
    void register_success() {
        // Given
        RegisterRequest req = new RegisterRequest("test@example.com", "nickname", "password123");
        Utente savedUser = new Utente();
        savedUser.setEmail("test@example.com");
        savedUser.setNickname("nickname");
        savedUser.setPasswordHash("hashedPassword");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.existsByNickname("nickname")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashedPassword");
        when(userRepository.save(any(Utente.class))).thenReturn(savedUser);

        // When
        UserResponse result = authService.register(req);

        // Then
        assertEquals("nickname", result.nickname());
        assertEquals("test@example.com", result.email());
        verify(userRepository, times(1)).existsByEmail("test@example.com");
        verify(userRepository, times(1)).existsByNickname("nickname");
        verify(passwordEncoder, times(1)).encode("password123");
        verify(userRepository, times(1)).save(any(Utente.class));
    }

    @Test
    void register_emailAlreadyExists() {
        // Given
        RegisterRequest req = new RegisterRequest("test@example.com", "nickname", "password123");
        
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class, 
            () -> authService.register(req)
        );
        
        assertEquals("Email già utilizzata", exception.getMessage());
        verify(userRepository, times(1)).existsByEmail("test@example.com");
        verify(userRepository, never()).existsByNickname(anyString());
        verify(userRepository, never()).save(any(Utente.class));
    }

    @Test
    void register_nicknameAlreadyExists() {
        // Given
        RegisterRequest req = new RegisterRequest("test@example.com", "nickname", "password123");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.existsByNickname("nickname")).thenReturn(true);

        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class, 
            () -> authService.register(req)
        );
        
        assertEquals("Nickname già utilizzato", exception.getMessage());
        verify(userRepository, times(1)).existsByEmail("test@example.com");
        verify(userRepository, times(1)).existsByNickname("nickname");
        verify(userRepository, never()).save(any(Utente.class));
    }

    @Test
    void register_trimAndLowercaseEmail() {
        // Given
        RegisterRequest req = new RegisterRequest(" TEST@Example.com ", "nickname", "password123");
        Utente savedUser = new Utente();
        savedUser.setEmail("test@example.com");
        savedUser.setNickname("nickname");

        when(userRepository.existsByEmail(" TEST@Example.com ")).thenReturn(false);
        when(userRepository.existsByNickname("nickname")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashedPassword");
        when(userRepository.save(any(Utente.class))).thenReturn(savedUser);

        // When
        UserResponse result = authService.register(req);

        // Then
        assertEquals("test@example.com", result.email());
        assertEquals("nickname", result.nickname());
    }

    @Test
    void register_trimNickname() {
        // Given
        RegisterRequest req = new RegisterRequest("test@example.com", " nickname ", "password123");
        Utente savedUser = new Utente();
        savedUser.setEmail("test@example.com");
        savedUser.setNickname("nickname");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.existsByNickname(" nickname ")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashedPassword");
        when(userRepository.save(any(Utente.class))).thenReturn(savedUser);

        // When
        UserResponse result = authService.register(req);

        // Then
        assertEquals("nickname", result.nickname());
    }

    @Test
    void login_success() {
        // Given
        Utente user = new Utente();
        user.setEmail("test@example.com");
        user.setNickname("nickname");
        user.setPasswordHash("hashedPassword");

        LoginRequest req = new LoginRequest("nickname", "password123");

        when(userRepository.findByNickname("nickname")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashedPassword")).thenReturn(true);

        // When
        UserResponse result = authService.login(req);

        // Then
        assertEquals("nickname", result.nickname());
        assertEquals("test@example.com", result.email());
        verify(userRepository, times(1)).findByNickname("nickname");
        verify(passwordEncoder, times(1)).matches("password123", "hashedPassword");
    }
    
    @Test
    void login_trimNickname() {
        // Given
        Utente user = new Utente();
        user.setEmail("test@example.com");
        user.setNickname("nickname");
        user.setPasswordHash("hashedPassword");

        LoginRequest req = new LoginRequest(" nickname ", "password123");

        when(userRepository.findByNickname("nickname")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashedPassword")).thenReturn(true);

        // When
        UserResponse result = authService.login(req);

        // Then
        assertEquals("nickname", result.nickname());
        assertEquals("test@example.com", result.email());
    }
    
    @Test
    void login_invalidNickname() {
        // Given
        LoginRequest req = new LoginRequest("nonexistent", "password123");
        
        when(userRepository.findByNickname("nonexistent")).thenReturn(Optional.empty());

        // When & Then
        BadCredentialsException exception = assertThrows(
            BadCredentialsException.class, 
            () -> authService.login(req)
        );
        
        assertEquals("Credenziali non valide", exception.getMessage());
        verify(userRepository, times(1)).findByNickname("nonexistent");
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void login_wrongPassword() {
        // Given
        Utente user = new Utente();
        user.setEmail("test@example.com");
        user.setNickname("nickname");
        user.setPasswordHash("hashedPassword");

        LoginRequest req = new LoginRequest("nickname", "wrongpass");

        when(userRepository.findByNickname("nickname")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpass", "hashedPassword")).thenReturn(false);

        // When & Then
        BadCredentialsException exception = assertThrows(
            BadCredentialsException.class, 
            () -> authService.login(req)
        );
        
        assertEquals("Credenziali non valide", exception.getMessage());
        verify(userRepository, times(1)).findByNickname("nickname");
        verify(passwordEncoder, times(1)).matches("wrongpass", "hashedPassword");
    }

    @Test
    void login_emptyNickname() {
        // Given
        LoginRequest req = new LoginRequest("", "password123");
        
        when(userRepository.findByNickname("")).thenReturn(Optional.empty());

        // When & Then
        BadCredentialsException exception = assertThrows(
            BadCredentialsException.class, 
            () -> authService.login(req)
        );
        
        assertEquals("Credenziali non valide", exception.getMessage());
    }

    @Test
    void login_nullPassword() {
        // Given
        Utente user = new Utente();
        user.setNickname("nickname");
        user.setPasswordHash("hashedPassword");

        LoginRequest req = new LoginRequest("nickname", null);

        when(userRepository.findByNickname("nickname")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(null, "hashedPassword")).thenReturn(false);

        // When & Then
        BadCredentialsException exception = assertThrows(
            BadCredentialsException.class, 
            () -> authService.login(req)
        );
        
        assertEquals("Credenziali non valide", exception.getMessage());
    }
}