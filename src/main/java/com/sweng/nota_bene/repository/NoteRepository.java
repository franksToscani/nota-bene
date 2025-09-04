package com.sweng.nota_bene.repository;

import java.time.LocalDateTime;
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
//////
@Query("""
SELECT DISTINCT n
FROM Note n
LEFT JOIN Condivisione c ON n.id = c.idNota
WHERE (n.proprietario = :emailUtente OR c.emailUtente = :emailUtente)
AND (
  :termineRicerca IS NULL OR
  LOWER(n.titolo)    LIKE LOWER(CONCAT('%', :termineRicerca, '%')) OR
  LOWER(n.contenuto) LIKE LOWER(CONCAT('%', :termineRicerca, '%')) OR
  (n.tag IS NOT NULL AND LOWER(n.tag) LIKE LOWER(CONCAT('%', :termineRicerca, '%')))
)
AND (:tag IS NULL OR n.tag = :tag)
AND (:dataCreazioneInizio IS NULL OR n.dataCreazione >= :dataCreazioneInizio)
AND (:dataCreazioneFine   IS NULL OR n.dataCreazione <= :dataCreazioneFine)
AND (:dataUltimaModificaInizio IS NULL OR n.dataUltimaModifica >= :dataUltimaModificaInizio)
AND (:dataUltimaModificaFine   IS NULL OR n.dataUltimaModifica <= :dataUltimaModificaFine)
ORDER BY n.dataUltimaModifica DESC
""")
List<Note> searchNotes(
        @Param("emailUtente") String emailUtente,
        @Param("termineRicerca") String termineRicerca,
        @Param("tag") String tag,
        @Param("dataCreazioneInizio") LocalDateTime dataCreazioneInizio,
        @Param("dataCreazioneFine") LocalDateTime dataCreazioneFine,
        @Param("dataUltimaModificaInizio") LocalDateTime dataUltimaModificaInizio,
        @Param("dataUltimaModificaFine") LocalDateTime dataUltimaModificaFine
);

    /**
     * Trova le note condivise con un utente specifico
     */
    @Query("SELECT n FROM Note n JOIN Condivisione c ON n.id = c.idNota " +
           "WHERE c.emailUtente = :emailUtente ORDER BY n.dataUltimaModifica DESC")
    List<Note> findSharedNotes(@Param("emailUtente") String emailUtente);
}