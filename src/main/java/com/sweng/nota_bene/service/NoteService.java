package com.sweng.nota_bene.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sweng.nota_bene.dto.CondivisioneResponse;
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
    private final CondivisioneService condivisioneService;

    public NoteService(NoteRepository noteRepository, TagService tagService, CondivisioneService condivisioneService) {
        this.noteRepository = noteRepository;
        this.tagService = tagService;
        this.condivisioneService = condivisioneService;
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

        // Gestione della cartella (opzionale)
        if (request.idCartella() != null) {
            note.setIdCartella(request.idCartella());
        }

        note = noteRepository.save(note);

        // Gestione delle condivisioni
        if (request.condivisioni() != null && !request.condivisioni().isEmpty()) {
            condivisioneService.updateCondivisioni(note.getId(), request.condivisioni(), proprietarioEmail);
        }

        return mapToNoteResponse(note);
    }

    public List<NoteListResponse> getNoteUtente(String proprietarioEmail) {
        List<Note> noteProprietario = noteRepository.findByProprietarioOrderByDataUltimaModificaDesc(proprietarioEmail);

        List<UUID> noteCondiviseIds = condivisioneService.getAccessibleNoteIds(proprietarioEmail);
        List<Note> noteCondivise = noteRepository.findAllById(noteCondiviseIds)
                .stream()
                .filter(nota -> !nota.getProprietario().equals(proprietarioEmail))
                .collect(Collectors.toList());

        List<Note> tutteLeNote = noteProprietario.stream().collect(Collectors.toList());
        tutteLeNote.addAll(noteCondivise);

        tutteLeNote.sort((a, b) -> b.getDataUltimaModifica().compareTo(a.getDataUltimaModifica()));

        return tutteLeNote.stream()
                .map(this::mapToNoteListResponse)
                .collect(Collectors.toList());
    }

    public NoteResponse getNotaById(UUID id, String proprietarioEmail) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nota non trovata"));

        if (!condivisioneService.hasReadPermission(id, proprietarioEmail, note.getProprietario())) {
            throw new IllegalArgumentException("Non hai i permessi per accedere a questa nota");
        }

        return mapToNoteResponse(note);
    }

    @Transactional
    public NoteResponse updateNote(UUID id, UpdateNoteRequest request, String proprietarioEmail) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nota non trovata"));

        if (!condivisioneService.hasWritePermission(id, proprietarioEmail, note.getProprietario())) {
            throw new IllegalArgumentException("Non hai i permessi per modificare questa nota");
        }

        // Aggiorna titolo, contenuto, tag e cartella
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
            note.setTag(null);
        }

        // Gestione della cartella
        note.setIdCartella(request.idCartella()); // accetta null per rimuovere la cartella

        note = noteRepository.save(note);

        if (note.getProprietario().equals(proprietarioEmail) && request.condivisioni() != null) {
            condivisioneService.updateCondivisioni(id, request.condivisioni(), note.getProprietario());
        }

        return mapToNoteResponse(note);
    }

    @Transactional
    public void deleteNote(UUID id, String proprietarioEmail) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nota non trovata"));

        if (!note.getProprietario().equals(proprietarioEmail)) {
            throw new IllegalArgumentException("Solo il proprietario può eliminare questa nota");
        }

        noteRepository.delete(note);
    }

    private NoteResponse mapToNoteResponse(Note note) {
        List<CondivisioneResponse> condivisioni = condivisioneService.getCondivisioniByNota(note.getId());

        return new NoteResponse(
                note.getId(),
                note.getTitolo(),
                note.getContenuto(),
                note.getProprietario(),
                note.getDataCreazione(),
                note.getDataUltimaModifica(),
                note.getIdCartella(),
                note.getTag(),
                condivisioni
        );
    }

    private NoteListResponse mapToNoteListResponse(Note note) {
        return new NoteListResponse(
                note.getId(),
                note.getTitolo(),
                note.getContenuto(),
                note.getDataUltimaModifica(),
                note.getTag(),
                note.getProprietario(),
                note.getIdCartella()
        );
    }
}
