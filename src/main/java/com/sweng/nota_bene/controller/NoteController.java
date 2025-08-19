package com.sweng.nota_bene.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sweng.nota_bene.dto.CreateNoteRequest;
import com.sweng.nota_bene.dto.NoteListResponse;
import com.sweng.nota_bene.dto.NoteResponse;
import com.sweng.nota_bene.dto.NoteVersionResponse;
import com.sweng.nota_bene.dto.TagResponse;
import com.sweng.nota_bene.dto.UpdateNoteRequest;
import com.sweng.nota_bene.service.NoteService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/note")
public class NoteController {
    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @PostMapping
    public ResponseEntity<?> createNote(@Valid @RequestBody CreateNoteRequest request) {
        // TODO: Per ora uso un utente mock, in seguito implementeremo l'autenticazione
        String proprietario = "test@example.com"; // Questo verrà sostituito con l'utente autenticato
        
        NoteResponse nota = noteService.createNote(request, proprietario);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "nota", nota,
                "message", "Nota creata con successo"
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNote(@PathVariable UUID id, @Valid @RequestBody UpdateNoteRequest request) {
        // TODO: Sostituire con utente autenticato
        String proprietario = "test@example.com";
        
        NoteResponse nota = noteService.updateNote(id, request, proprietario);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "nota", nota,
                "message", "Nota modificata con successo"
        ));
    }

    @GetMapping
    public ResponseEntity<?> getNoteUtente(@RequestParam(required = false) String tag) {
        // TODO: Sostituire con utente autenticato
        String proprietario = "test@example.com";
        
        List<NoteListResponse> note;
        if (tag != null && !tag.isEmpty()) {
            note = noteService.getNoteUtenteByTag(proprietario, tag);
        } else {
            note = noteService.getNoteUtente(proprietario);
        }
        
        return ResponseEntity.ok(Map.of(
                "success", true,
                "note", note
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getNotaById(@PathVariable UUID id) {
        // TODO: Sostituire con utente autenticato
        String proprietario = "test@example.com";
        
        NoteResponse nota = noteService.getNotaById(id, proprietario);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "nota", nota
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(@PathVariable UUID id) {
        // TODO: Sostituire con utente autenticato
        String proprietario = "test@example.com";
        
        noteService.deleteNote(id, proprietario);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Nota eliminata con successo"
        ));
    }

    @GetMapping("/{id}/versions")
    public ResponseEntity<?> getNoteVersions(@PathVariable UUID id) {
        // TODO: Sostituire con utente autenticato
        String proprietario = "test@example.com";
        
        List<NoteVersionResponse> versions = noteService.getNoteVersions(id, proprietario);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "versions", versions
        ));
    }

    @PostMapping("/{id}/restore/{versionId}")
    public ResponseEntity<?> restoreNoteVersion(@PathVariable UUID id, @PathVariable UUID versionId) {
        // TODO: Sostituire con utente autenticato
        String proprietario = "test@example.com";
        
        NoteResponse nota = noteService.restoreNoteVersion(id, versionId, proprietario);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "nota", nota,
                "message", "Nota ripristinata con successo"
        ));
    }

    @GetMapping("/tags")
    public ResponseEntity<?> getAllTags() {
        List<TagResponse> tags = noteService.getAllTags();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "tags", tags
        ));
    }
}