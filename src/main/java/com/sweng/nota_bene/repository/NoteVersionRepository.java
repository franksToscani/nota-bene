package com.sweng.nota_bene.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sweng.nota_bene.model.NoteVersion;

@Repository
public interface NoteVersionRepository extends JpaRepository<NoteVersion, UUID> {
    List<NoteVersion> findByNotaIdOrderByDataModificaDesc(UUID notaId);
}