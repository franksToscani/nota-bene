package com.sweng.nota_bene.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.sweng.nota_bene.model.Condivisione;

@Repository
public interface CondivisioneRepository extends JpaRepository<Condivisione, UUID> {
    
    /**
     * Trova tutte le condivisioni per una specifica nota
     */
    List<Condivisione> findByIdNota(UUID idNota);
    
    /**
     * Trova una specifica condivisione per nota e utente
     */
    Optional<Condivisione> findByIdNotaAndEmailUtente(UUID idNota, String emailUtente);
    
    /**
     * Trova tutte le note condivise con un utente (per vedere le note accessibili)
     */
    List<Condivisione> findByEmailUtente(String emailUtente);
    
    /**
     * Elimina tutte le condivisioni per una specifica nota
     */
    @Modifying
    void deleteByIdNota(UUID idNota);
    
    /**
     * Elimina una specifica condivisione
     */
    @Modifying
    void deleteByIdNotaAndEmailUtente(UUID idNota, String emailUtente);
    
    /**
     * Controlla se un utente ha accesso a una nota (qualsiasi tipo di permesso)
     */
    boolean existsByIdNotaAndEmailUtente(UUID idNota, String emailUtente);
    
    /**
     * Controlla se un utente ha permessi di scrittura su una nota
     */
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Condivisione c " +
           "WHERE c.idNota = :idNota AND c.emailUtente = :emailUtente AND c.tipo = 'scrittura'")
    boolean hasWritePermission(@Param("idNota") UUID idNota, @Param("emailUtente") String emailUtente);
    
    /**
     * Query per ottenere tutte le note accessibili a un utente (proprie + condivise)
     */
    @Query("SELECT DISTINCT c.idNota FROM Condivisione c WHERE c.emailUtente = :emailUtente")
    List<UUID> findAccessibleNoteIds(@Param("emailUtente") String emailUtente);
}