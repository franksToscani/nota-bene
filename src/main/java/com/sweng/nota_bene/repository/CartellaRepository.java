package com.sweng.nota_bene.repository;

import com.sweng.nota_bene.model.Cartella;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CartellaRepository extends JpaRepository<Cartella, UUID> {
    // Metodo per trovare tutte le cartelle di un proprietario
    List<Cartella> findByProprietario(String proprietario);
}
