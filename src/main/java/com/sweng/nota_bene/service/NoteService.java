package com.sweng.nota_bene.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sweng.nota_bene.dto.CreateNoteRequest;
import com.sweng.nota_bene.dto.NoteListResponse;
import com.sweng.nota_bene.dto.NoteResponse;
import com.sweng.nota_bene.dto.UpdateNoteRequest;
import com.sweng.nota_bene.model.Note;
import com.sweng.nota_bene.repository.NoteRepository;

@Service
public class NoteService {
    private final NoteRepository noteRepository;

    public NoteService(NoteRepository noteRepository) {
        this.noteRepository = noteRepository;
    }

    @Transactional
    public NoteResponse createNote(CreateNoteRequest request, String proprietarioEmail) {
        // Creazione della nota - versione semplificata
        Note note = new Note();
        note.setTitolo(request.titolo());
        note.setContenuto(request.contenuto());
        note.setProprietario(proprietarioEmail); // Ora usiamo l'email
        // idCartella e tag rimangono null per la versione semplificata
        
        note = noteRepository.save(note);
        return mapToNoteResponse(note);
    }

    public List<NoteListResponse> getNoteUtente(String proprietarioEmail) {
        List<Note> notes = noteRepository.findByProprietarioOrderByDataUltimaModificaDesc(proprietarioEmail);
        return notes.stream()
                .map(this::mapToNoteListResponse)
                .collect(Collectors.toList());
    }

    public NoteResponse getNotaById(UUID id, String proprietarioEmail) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nota non trovata"));
        
        if (!note.getProprietario().equals(proprietarioEmail)) {
            throw new IllegalArgumentException("Non hai i permessi per accedere a questa nota");
        }
        
        return mapToNoteResponse(note);
    }

    @Transactional
    public NoteResponse updateNote(UUID id, UpdateNoteRequest request, String proprietarioEmail) {
        // Trova la nota esistente
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nota non trovata"));
        
        // Verifica i permessi
        if (!note.getProprietario().equals(proprietarioEmail)) {
            throw new IllegalArgumentException("Non hai i permessi per modificare questa nota");
        }

        // Aggiorna solo titolo e contenuto
        note.setTitolo(request.titolo());
        note.setContenuto(request.contenuto());
        // La data di ultima modifica viene aggiornata automaticamente dal @PreUpdate
        
        note = noteRepository.save(note);
        return mapToNoteResponse(note);
    }

    @Transactional
    public void deleteNote(UUID id, String proprietarioEmail) {
        // Trova la nota esistente
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nota non trovata"));
        
        // Verifica i permessi
        if (!note.getProprietario().equals(proprietarioEmail)) {
            throw new IllegalArgumentException("Non hai i permessi per eliminare questa nota");
        }

        // Elimina la nota
        noteRepository.delete(note);
    }

    private NoteResponse mapToNoteResponse(Note note) {
        return new NoteResponse(
                note.getId(),
                note.getTitolo(),
                note.getContenuto(),
                note.getProprietario(),
                note.getDataCreazione(),
                note.getDataUltimaModifica(),
                note.getIdCartella(),
                note.getTag()
        );
    }

    private NoteListResponse mapToNoteListResponse(Note note) {
        return new NoteListResponse(
                note.getId(),
                note.getTitolo(),
                note.getContenuto(),
                note.getDataUltimaModifica(),
                note.getTag()
        );
    }
}