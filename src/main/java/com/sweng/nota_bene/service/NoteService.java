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
    private final TagService tagService;

    public NoteService(NoteRepository noteRepository, TagService tagService) {
        this.noteRepository = noteRepository;
        this.tagService = tagService;
    }

    @Transactional
    public NoteResponse createNote(CreateNoteRequest request, String proprietarioEmail) {
        Note note = new Note();
        note.setTitolo(request.titolo());
        note.setContenuto(request.contenuto());
        note.setProprietario(proprietarioEmail);
        
        // Gestione del tag
        if (request.tagId() != null && !request.tagId().trim().isEmpty()) {
            String tagNome = request.tagId().trim();
            if (tagService.existsByNome(tagNome)) {
                note.setTag(tagNome);
            } else {
                throw new IllegalArgumentException("Tag non valido: " + tagNome);
            }
        }
        
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
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nota non trovata"));
        
        if (!note.getProprietario().equals(proprietarioEmail)) {
            throw new IllegalArgumentException("Non hai i permessi per modificare questa nota");
        }

        // Aggiorna titolo e contenuto
        note.setTitolo(request.titolo());
        note.setContenuto(request.contenuto());
        
        // Gestione del tag
        if (request.tagId() != null && !request.tagId().trim().isEmpty()) {
            String tagNome = request.tagId().trim();
            if (tagService.existsByNome(tagNome)) {
                note.setTag(tagNome);
            } else {
                throw new IllegalArgumentException("Tag non valido: " + tagNome);
            }
        } else {
            // Se tagId è null o vuoto, rimuovi il tag
            note.setTag(null);
        }
        
        note = noteRepository.save(note);
        return mapToNoteResponse(note);
    }

    @Transactional
    public void deleteNote(UUID id, String proprietarioEmail) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nota non trovata"));
        
        if (!note.getProprietario().equals(proprietarioEmail)) {
            throw new IllegalArgumentException("Non hai i permessi per eliminare questa nota");
        }

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