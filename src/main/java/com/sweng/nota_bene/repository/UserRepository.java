package com.sweng.nota_bene.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sweng.nota_bene.model.Utente;

public interface UserRepository extends JpaRepository<Utente, Long> {
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);
    Optional<Utente> findByNickname(String nickname);
}
