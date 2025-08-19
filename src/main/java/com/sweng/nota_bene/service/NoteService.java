package com.sweng.nota_bene.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sweng.nota_bene.dto.CreateNoteRequest;
import com.sweng.nota_bene.dto.NoteListResponse;
import com.sweng.nota_bene.dto.NoteResponse;
import com.sweng.nota_bene.dto.NoteVersionResponse;
import com.sweng.nota_bene.dto.TagResponse;
import com.sweng.nota_bene.dto.UpdateNoteRequest;
import com.sweng.nota_bene.model.Note;
import com.sweng.nota_bene.model.NoteVersion;
import com.sweng.nota_bene.model.Tag;
import com.sweng.nota_bene.repository.NoteRepository;
import com.sweng.nota_bene.repository.NoteVersionRepository;
import com.sweng.nota_bene.repository.TagRepository;

@Service
public class NoteService {
    private final NoteRepository noteRepository;
    private final NoteVersionRepository noteVersionRepository;
    private final TagRepository tagRepository;

    public NoteService(NoteRepository noteRepository, 
                       NoteVersionRepository noteVersionRepository,
                       TagRepository tagRepository) {
        this.noteRepository = noteRepository;
        this.noteVersionRepository = noteVersionRepository;
        this.tagRepository = tagRepository;
    }

    @Transactional
    public NoteResponse createNote(CreateNoteRequest request, String proprietario) {
        // Validazione del tag se presente
        if (request.tag() != null && !request.tag().isEmpty()) {
            if (!tagRepository.existsById(request.tag())) {
                throw new IllegalArgumentException("Tag non valido: " + request.tag());
            }
        }

        // Creazione della nota
        Note note = new Note();
        note.setTitolo(request.titolo());
        note.setContenuto(request.contenuto());
        note.setProprietario(proprietario);
        note.setIdCartella(request.idCartella());
        note.setTag(request.tag());
        
        note = noteRepository.save(note);

        // Creazione della prima versione
        NoteVersion versione = new NoteVersion();
        versione.setNotaId(note.getId());
        versione.setTitolo(note.getTitolo());
        versione.setContenuto(note.getContenuto());
        versione.setCreatore(proprietario);
        
        noteVersionRepository.save(versione);

        return mapToNoteResponse(note);
    }

    public List<NoteListResponse> getNoteUtente(String proprietario) {
        List<Note> notes = noteRepository.findByProprietarioOrderByDataUltimaModificaDesc(proprietario);
        return notes.stream()
                .map(this::mapToNoteListResponse)
                .collect(Collectors.toList());
    }

    public List<NoteListResponse> getNoteUtenteByTag(String proprietario, String tag) {
        List<Note> notes = noteRepository.findByProprietarioAndTagOrderByDataUltimaModificaDesc(proprietario, tag);
        return notes.stream()
                .map(this::mapToNoteListResponse)
                .collect(Collectors.toList());
    }

    public NoteResponse getNotaById(UUID id, String proprietario) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nota non trovata"));
        
        if (!note.getProprietario().equals(proprietario)) {
            throw new IllegalArgumentException("Non hai i permessi per accedere a questa nota");
        }
        
        return mapToNoteResponse(note);
    }

    @Transactional
    public NoteResponse updateNote(UUID id, UpdateNoteRequest request, String proprietario) {
        // Trova la nota esistente
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nota non trovata"));
        
        // Verifica i permessi
        if (!note.getProprietario().equals(proprietario)) {
            throw new IllegalArgumentException("Non hai i permessi per modificare questa nota");
        }

        // Validazione del tag se presente
        if (request.tag() != null && !request.tag().isEmpty()) {
            if (!tagRepository.existsById(request.tag())) {
                throw new IllegalArgumentException("Tag non valido: " + request.tag());
            }
        }

        // Salva lo stato attuale come versione prima di modificare
        NoteVersion nuovaVersione = new NoteVersion();
        nuovaVersione.setNotaId(note.getId());
        nuovaVersione.setTitolo(note.getTitolo());
        nuovaVersione.setContenuto(note.getContenuto());
        nuovaVersione.setCreatore(proprietario);
        noteVersionRepository.save(nuovaVersione);

        // Aggiorna la nota
        note.setTitolo(request.titolo());
        note.setContenuto(request.contenuto());
        note.setIdCartella(request.idCartella());
        note.setTag(request.tag());
        // La data di ultima modifica viene aggiornata automaticamente dal @PreUpdate
        
        note = noteRepository.save(note);

        return mapToNoteResponse(note);
    }

    public List<NoteVersionResponse> getNoteVersions(UUID notaId, String proprietario) {
        // Verifica che la nota esista e che l'utente abbia i permessi
        Note note = noteRepository.findById(notaId)
                .orElseThrow(() -> new IllegalArgumentException("Nota non trovata"));
        
        if (!note.getProprietario().equals(proprietario)) {
            throw new IllegalArgumentException("Non hai i permessi per accedere alle versioni di questa nota");
        }

        // Ottieni tutte le versioni della nota
        List<NoteVersion> versions = noteVersionRepository.findByNotaIdOrderByDataModificaDesc(notaId);
        return versions.stream()
                .map(this::mapToNoteVersionResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public NoteResponse restoreNoteVersion(UUID notaId, UUID versionId, String proprietario) {
        // Verifica che la nota esista e che l'utente abbia i permessi
        Note note = noteRepository.findById(notaId)
                .orElseThrow(() -> new IllegalArgumentException("Nota non trovata"));
        
        if (!note.getProprietario().equals(proprietario)) {
            throw new IllegalArgumentException("Non hai i permessi per ripristinare questa nota");
        }

        // Trova la versione da ripristinare
        NoteVersion versionToRestore = noteVersionRepository.findById(versionId)
                .orElseThrow(() -> new IllegalArgumentException("Versione non trovata"));
        
        if (!versionToRestore.getNotaId().equals(notaId)) {
            throw new IllegalArgumentException("La versione non appartiene a questa nota");
        }

        // Salva lo stato attuale come nuova versione prima del ripristino
        NoteVersion currentVersion = new NoteVersion();
        currentVersion.setNotaId(note.getId());
        currentVersion.setTitolo(note.getTitolo());
        currentVersion.setContenuto(note.getContenuto());
        currentVersion.setCreatore(proprietario);
        noteVersionRepository.save(currentVersion);

        // Ripristina la nota alla versione selezionata
        note.setTitolo(versionToRestore.getTitolo());
        note.setContenuto(versionToRestore.getContenuto());
        // La data di ultima modifica viene aggiornata automaticamente dal @PreUpdate
        
        note = noteRepository.save(note);

        return mapToNoteResponse(note);
    }

    @Transactional
    public void deleteNote(UUID id, String proprietario) {
        // Trova la nota esistente
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nota non trovata"));
        
        // Verifica i permessi
        if (!note.getProprietario().equals(proprietario)) {
            throw new IllegalArgumentException("Non hai i permessi per eliminare questa nota");
        }

        // Elimina la nota (le versioni verranno eliminate automaticamente dal CASCADE)
        noteRepository.delete(note);
    }

    public List<TagResponse> getAllTags() {
        List<Tag> tags = tagRepository.findAllByOrderByNomeAsc();
        return tags.stream()
                .map(tag -> new TagResponse(tag.getNome()))
                .collect(Collectors.toList());
    }

    private NoteVersionResponse mapToNoteVersionResponse(NoteVersion version) {
        return new NoteVersionResponse(
                version.getId(),
                version.getNotaId(),
                version.getTitolo(),
                version.getContenuto(),
                version.getDataModifica(),
                version.getCreatore()
        );
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