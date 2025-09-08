package com.sweng.nota_bene.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sweng.nota_bene.model.Cartella;

@Repository
public interface CartellaRepository extends JpaRepository<Cartella, UUID> {

    List<Cartella> findByProprietario(String proprietario);
}
