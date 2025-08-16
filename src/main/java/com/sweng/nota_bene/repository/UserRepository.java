package com.sweng.nota_bene.repository;

import com.sweng.nota_bene.model.Utente;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<Utente, Long> {
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);
    Optional<Utente> findByNickname(String nickname);
}
