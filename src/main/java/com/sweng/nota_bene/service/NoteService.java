package com.sweng.nota_bene.service;

import java.time.OffsetDateTime;
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
import com.sweng.nota_bene.repository.NoteSpecification;


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
        
        note = noteRepository.save(note);
        
        // Gestione delle condivisioni - passa l'email del proprietario per la validazione
        if (request.condivisioni() != null && !request.condivisioni().isEmpty()) {
            condivisioneService.updateCondivisioni(note.getId(), request.condivisioni(), proprietarioEmail);
        }
        
        return mapToNoteResponse(note);
    }

    public List<NoteListResponse> getNoteUtente(String proprietarioEmail) {
        // Ottieni le note di proprietà dell'utente
        List<Note> noteProprietario = noteRepository.findByProprietarioOrderByDataUltimaModificaDesc(proprietarioEmail);
        
        // Ottieni gli ID delle note condivise con l'utente
        List<UUID> noteCondiviseIds = condivisioneService.getAccessibleNoteIds(proprietarioEmail);
        
        // Ottieni le note condivise (escludendo quelle di cui è proprietario per evitare duplicati)
        List<Note> noteCondivise = noteRepository.findAllById(noteCondiviseIds)
            .stream()
            .filter(nota -> !nota.getProprietario().equals(proprietarioEmail))
            .collect(Collectors.toList());
        
        // Combina e ordina tutte le note
        List<Note> tutteLeNote = noteProprietario.stream()
            .collect(Collectors.toList());
        tutteLeNote.addAll(noteCondivise);
        
        // Ordina per data ultima modifica
        tutteLeNote.sort((a, b) -> b.getDataUltimaModifica().compareTo(a.getDataUltimaModifica()));
        
        return tutteLeNote.stream()
                .map(this::mapToNoteListResponse)
                .collect(Collectors.toList());
    }

    public List<NoteListResponse> searchNotes(
            String proprietarioEmail,
            String searchTerm,
            String tag,
            OffsetDateTime dataCreazioneInizio,
            OffsetDateTime dataCreazioneFine,
            OffsetDateTime dataUltimaModificaInizio,
            OffsetDateTime dataUltimaModificaFine
    ) {
        List<UUID> noteCondiviseIds = condivisioneService.getAccessibleNoteIds(proprietarioEmail);

        var spec = NoteSpecification.withOwnerOrShared(proprietarioEmail, noteCondiviseIds)
                .and(NoteSpecification.withSearchTerm(searchTerm))
                .and(NoteSpecification.withTag(tag))
                .and(NoteSpecification.withCreationDateBetween(dataCreazioneInizio, dataCreazioneFine))
                .and(NoteSpecification.withLastModifiedDateBetween(dataUltimaModificaInizio, dataUltimaModificaFine));

        List<Note> note = noteRepository.findAll(spec);

        note.sort((a, b) -> b.getDataUltimaModifica().compareTo(a.getDataUltimaModifica()));

        return note.stream()
                .map(this::mapToNoteListResponse)
                .collect(Collectors.toList());
    }
    public NoteResponse getNotaById(UUID id, String proprietarioEmail) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nota non trovata"));
        
        // Verifica permessi di lettura
        if (!condivisioneService.hasReadPermission(id, proprietarioEmail, note.getProprietario())) {
            throw new IllegalArgumentException("Non hai i permessi per accedere a questa nota");
        }
        
        return mapToNoteResponse(note);
    }

    @Transactional
    public NoteResponse copyNote(UUID id, String emailUtente) {
        Note originale = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nota non trovata"));

        if (!condivisioneService.hasReadPermission(id, emailUtente, originale.getProprietario())) {
            throw new IllegalArgumentException("Non hai i permessi per accedere a questa nota");
        }

        Note copia = new Note();
        copia.setTitolo(originale.getTitolo());
        copia.setContenuto(originale.getContenuto());
        copia.setTag(originale.getTag());
        copia.setProprietario(emailUtente);

        copia = noteRepository.save(copia);

        return mapToNoteResponse(copia);
    }

    @Transactional
    public NoteResponse updateNote(UUID id, UpdateNoteRequest request, String proprietarioEmail) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nota non trovata"));
        
        // Verifica permessi di scrittura
        if (!condivisioneService.hasWritePermission(id, proprietarioEmail, note.getProprietario())) {
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
        
        // Solo il proprietario può gestire le condivisioni - passa l'email del proprietario
        if (note.getProprietario().equals(proprietarioEmail) && request.condivisioni() != null) {
            condivisioneService.updateCondivisioni(id, request.condivisioni(), note.getProprietario());
        }
        
        return mapToNoteResponse(note);
    }

    @Transactional
    public void deleteNote(UUID id, String proprietarioEmail) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nota non trovata"));
        
        // Solo il proprietario può eliminare la nota
        if (!note.getProprietario().equals(proprietarioEmail)) {
            throw new IllegalArgumentException("Solo il proprietario può eliminare questa nota");
        }

        // Le condivisioni vengono eliminate automaticamente dalla CASCADE nel DB
        noteRepository.delete(note);
    }

    private NoteResponse mapToNoteResponse(Note note) {
        // Ottieni le condivisioni per questa nota
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
                note.getDataCreazione(),
                note.getDataUltimaModifica(),
                note.getTag(),
                note.getProprietario()
        );
    }
}