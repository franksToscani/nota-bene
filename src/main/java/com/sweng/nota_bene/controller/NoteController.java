package com.sweng.nota_bene.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.format.annotation.DateTimeFormat.ISO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.sweng.nota_bene.dto.CreateNoteRequest;
import com.sweng.nota_bene.dto.NoteListResponse;
import com.sweng.nota_bene.dto.NoteResponse;
import com.sweng.nota_bene.dto.UpdateNoteRequest;
import com.sweng.nota_bene.dto.UserResponse;
import com.sweng.nota_bene.service.NoteService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/note")
public class NoteController {
    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    /**
     * Recupera l'email dell'utente autenticato dalla sessione Spring Security
     */
    private String getAuthenticatedUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserResponse) {
            UserResponse user = (UserResponse) authentication.getPrincipal();
            return user.email();
        }
        throw new IllegalStateException("Utente non autenticato");
    }

    @PostMapping
    public ResponseEntity<?> createNote(@Valid @RequestBody CreateNoteRequest request) {
        try {
            String proprietarioEmail = getAuthenticatedUserEmail();
            NoteResponse nota = noteService.createNote(request, proprietarioEmail);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "nota", nota,
                    "message", "Nota creata con successo"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateNote(@PathVariable UUID id, @Valid @RequestBody UpdateNoteRequest request) {
        try {
            String proprietarioEmail = getAuthenticatedUserEmail();
            NoteResponse nota = noteService.updateNote(id, request, proprietarioEmail);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "nota", nota,
                    "message", "Nota modificata con successo"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<?> getNoteUtente() {
        try {
            String proprietarioEmail = getAuthenticatedUserEmail();
            List<NoteListResponse> note = noteService.getNoteUtente(proprietarioEmail);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "note", note
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchNotes(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate createdFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate createdTo,
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate modifiedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate modifiedTo) { try {
            String proprietarioEmail = getAuthenticatedUserEmail();

            LocalDateTime createdFromDT = createdFrom != null ? createdFrom.atStartOfDay() : null;
        LocalDateTime createdToDT = createdTo != null ? createdTo.atTime(23, 59, 59) : null;
        LocalDateTime modifiedFromDT = modifiedFrom != null ? modifiedFrom.atStartOfDay() : null;
        LocalDateTime modifiedToDT = modifiedTo != null ? modifiedTo.atTime(23, 59, 59) : null;

        List<NoteListResponse> note = noteService.searchNotes(
                proprietarioEmail,
                searchTerm,
                tag,
                createdFromDT,
                createdToDT,
                modifiedFromDT,
                modifiedToDT
            );
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "note", note
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
    @GetMapping("/{id}")
    public ResponseEntity<?> getNotaById(@PathVariable UUID id) {
        try {
            String proprietarioEmail = getAuthenticatedUserEmail();
            NoteResponse nota = noteService.getNotaById(id, proprietarioEmail);
            
            // Il frontend si aspetta la nota direttamente, non wrapped in un oggetto
            return ResponseEntity.ok(nota);
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "Errore interno del server"
            ));
        }
    }

    @PostMapping("/{id}/copy")
    public ResponseEntity<?> copyNote(@PathVariable UUID id) {
        try {
            String proprietarioEmail = getAuthenticatedUserEmail();
            NoteResponse nota = noteService.copyNote(id, proprietarioEmail);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "nota", nota,
                    "message", "Nota copiata con successo"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNote(@PathVariable UUID id) {
        try {
            String proprietarioEmail = getAuthenticatedUserEmail();
            noteService.deleteNote(id, proprietarioEmail);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Nota eliminata con successo"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
}