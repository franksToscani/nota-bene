package com.sweng.nota_bene.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sweng.nota_bene.model.Note;

@Repository
public interface NoteRepository extends JpaRepository<Note, UUID> {
    List<Note> findByProprietarioOrderByDataUltimaModificaDesc(String proprietario);
    List<Note> findByProprietarioAndTagOrderByDataUltimaModificaDesc(String proprietario, String tag);
    List<Note> findByProprietarioAndIdCartella(String proprietario, UUID idCartella);
}