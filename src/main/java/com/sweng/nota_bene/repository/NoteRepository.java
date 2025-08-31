package com.sweng.nota_bene.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.sweng.nota_bene.model.Note;

@Repository
public interface NoteRepository extends JpaRepository<Note, UUID> {
    
    /**
     * Trova le note di proprietà di un utente ordinate per data ultima modifica
     */
    List<Note> findByProprietarioOrderByDataUltimaModificaDesc(String proprietario);
    
    /**
     * Trova le note di proprietà di un utente filtrate per tag
     */
    List<Note> findByProprietarioAndTagOrderByDataUltimaModificaDesc(String proprietario, String tag);
    
    /**
     * Trova le note di proprietà di un utente in una specifica cartella
     */
    List<Note> findByProprietarioAndIdCartella(String proprietario, UUID idCartella);
    
    /**
     * Trova tutte le note accessibili a un utente (proprie + condivise)
     * Questa query combina le note di proprietà e quelle condivise
     */
    @Query("SELECT DISTINCT n FROM Note n LEFT JOIN Condivisione c ON n.id = c.idNota " +
           "WHERE n.proprietario = :emailUtente OR c.emailUtente = :emailUtente " +
           "ORDER BY n.dataUltimaModifica DESC")
    List<Note> findAccessibleNotes(@Param("emailUtente") String emailUtente);
    
    /**
     * Trova le note condivise con un utente specifico
     */
    @Query("SELECT n FROM Note n JOIN Condivisione c ON n.id = c.idNota " +
           "WHERE c.emailUtente = :emailUtente ORDER BY n.dataUltimaModifica DESC")
    List<Note> findSharedNotes(@Param("emailUtente") String emailUtente);
}