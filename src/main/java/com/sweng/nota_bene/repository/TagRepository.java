package com.sweng.nota_bene.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.sweng.nota_bene.model.Tag;

@Repository
public interface TagRepository extends JpaRepository<Tag, String> {
    
    /**
     * Trova tutti i tag ordinati alfabeticamente per nome
     */
    @Query("SELECT t FROM Tag t ORDER BY t.nome ASC")
    List<Tag> findAllOrderByNome();
    
    /**
     * Verifica se esiste un tag con il nome specificato (case insensitive)
     */
    @Query("SELECT COUNT(t) > 0 FROM Tag t WHERE LOWER(t.nome) = LOWER(?1)")
    boolean existsByNomeIgnoreCase(String nome);
}