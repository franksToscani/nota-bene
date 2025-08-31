package com.sweng.nota_bene;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.sweng.nota_bene.dto.CondivisioneRequest;
import com.sweng.nota_bene.dto.CondivisioneResponse;
import com.sweng.nota_bene.dto.CreateNoteRequest;
import com.sweng.nota_bene.dto.NoteListResponse;
import com.sweng.nota_bene.dto.NoteResponse;
import com.sweng.nota_bene.dto.UpdateNoteRequest;
import com.sweng.nota_bene.model.Condivisione.TipoCondivisione;
import com.sweng.nota_bene.model.Note;
import com.sweng.nota_bene.repository.NoteRepository;
import com.sweng.nota_bene.service.CondivisioneService;
import com.sweng.nota_bene.service.NoteService;
import com.sweng.nota_bene.service.TagService;

@ExtendWith(MockitoExtension.class)
class NoteServiceTest {

    @Mock
    private NoteRepository noteRepository;
    
    @Mock
    private TagService tagService;
    
    @Mock
    private CondivisioneService condivisioneService;
    
    @InjectMocks
    private NoteService noteService;
    
    private Note sampleNote;
    private UUID noteId;
    private String proprietarioEmail;
    private String altroUtenteEmail;
        
    @Test
    void testCreateNote_Success() {
        // Given
        List<CondivisioneRequest> condivisioni = List.of(
            new CondivisioneRequest(altroUtenteEmail, TipoCondivisione.lettura)
        );
        
        CreateNoteRequest request = new CreateNoteRequest(
            "Nuova Nota",
            "Contenuto della nuova nota",
            "lavoro",
            condivisioni
        );
        
        when(tagService.existsByNome("lavoro")).thenReturn(true);
        when(noteRepository.save(any(Note.class))).thenReturn(sampleNote);
        when(condivisioneService.getCondivisioniByNota(noteId)).thenReturn(
            List.of(new CondivisioneResponse(altroUtenteEmail, TipoCondivisione.lettura))
        );
        
        // When
        NoteResponse result = noteService.createNote(request, proprietarioEmail);
        
        // Then
        assertNotNull(result);
        assertEquals("Test Note", result.titolo());
        assertEquals("Contenuto di test", result.contenuto());
        assertEquals(proprietarioEmail, result.proprietario());
        assertEquals("lavoro", result.tag());
        
        verify(noteRepository).save(any(Note.class));
        verify(condivisioneService).updateCondivisioni(noteId, condivisioni, proprietarioEmail);
    }
    
    @Test
    void testCreateNote_WithInvalidTag_ThrowsException() {
        // Given
        CreateNoteRequest request = new CreateNoteRequest(
            "Nuova Nota",
            "Contenuto della nuova nota",
            "tag_inesistente",
            null
        );
        
        when(tagService.existsByNome("tag_inesistente")).thenReturn(false);
        
        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> noteService.createNote(request, proprietarioEmail)
        );
        
        assertEquals("Tag non valido: tag_inesistente", exception.getMessage());
        verify(noteRepository, never()).save(any(Note.class));
    }
    
    @Test
    void testCreateNote_WithEmptyTag_Success() {
        // Given
        CreateNoteRequest request = new CreateNoteRequest(
            "Nuova Nota",
            "Contenuto della nuova nota",
            "",
            null
        );
        
        Note noteWithoutTag = new Note();
        noteWithoutTag.setId(noteId);
        noteWithoutTag.setTitolo("Nuova Nota");
        noteWithoutTag.setContenuto("Contenuto della nuova nota");
        noteWithoutTag.setProprietario(proprietarioEmail);
        
        when(noteRepository.save(any(Note.class))).thenReturn(noteWithoutTag);
        when(condivisioneService.getCondivisioniByNota(noteId)).thenReturn(Collections.emptyList());
        
        // When
        NoteResponse result = noteService.createNote(request, proprietarioEmail);
        
        // Then
        assertNotNull(result);
        assertNull(result.tag());
        verify(tagService, never()).existsByNome(anyString());
    }
    
    @Test
    void testGetNoteUtente_Success() {
        // Given
        List<Note> noteProprietario = List.of(sampleNote);
        List<UUID> noteCondiviseIds = List.of(UUID.randomUUID());
        
        Note noteCondivisa = new Note();
        noteCondivisa.setId(noteCondiviseIds.get(0));
        noteCondivisa.setTitolo("Nota Condivisa");
        noteCondivisa.setContenuto("Contenuto condiviso");
        noteCondivisa.setProprietario(altroUtenteEmail);
        noteCondivisa.setDataUltimaModifica(LocalDateTime.now().minusHours(1));
        
        when(noteRepository.findByProprietarioOrderByDataUltimaModificaDesc(proprietarioEmail))
            .thenReturn(noteProprietario);
        when(condivisioneService.getAccessibleNoteIds(proprietarioEmail))
            .thenReturn(noteCondiviseIds);
        when(noteRepository.findAllById(noteCondiviseIds))
            .thenReturn(List.of(noteCondivisa));
        
        // When
        List<NoteListResponse> result = noteService.getNoteUtente(proprietarioEmail);
        
        // Then
        assertEquals(2, result.size());
        assertEquals("Test Note", result.get(0).titolo());
        assertEquals("Nota Condivisa", result.get(1).titolo());
    }
    
    @Test
    void testGetNotaById_Success() {
        // Given
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(sampleNote));
        when(condivisioneService.hasReadPermission(noteId, proprietarioEmail, proprietarioEmail))
            .thenReturn(true);
        when(condivisioneService.getCondivisioniByNota(noteId))
            .thenReturn(Collections.emptyList());
        
        // When
        NoteResponse result = noteService.getNotaById(noteId, proprietarioEmail);
        
        // Then
        assertNotNull(result);
        assertEquals("Test Note", result.titolo());
        assertEquals(proprietarioEmail, result.proprietario());
    }
    
    @Test
    void testGetNotaById_NotFound_ThrowsException() {
        // Given
        when(noteRepository.findById(noteId)).thenReturn(Optional.empty());
        
        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> noteService.getNotaById(noteId, proprietarioEmail)
        );
        
        assertEquals("Nota non trovata", exception.getMessage());
    }
    
    @Test
    void testGetNotaById_NoPermission_ThrowsException() {
        // Given
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(sampleNote));
        when(condivisioneService.hasReadPermission(noteId, altroUtenteEmail, proprietarioEmail))
            .thenReturn(false);
        
        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> noteService.getNotaById(noteId, altroUtenteEmail)
        );
        
        assertEquals("Non hai i permessi per accedere a questa nota", exception.getMessage());
    }
    
    @Test
    void testUpdateNote_Success() {
        // Given
        List<CondivisioneRequest> condivisioni = List.of(
            new CondivisioneRequest(altroUtenteEmail, TipoCondivisione.scrittura)
        );
        
        UpdateNoteRequest request = new UpdateNoteRequest(
            "Titolo Modificato",
            "Contenuto modificato",
            "studio",
            condivisioni
        );
        
        Note updatedNote = new Note();
        updatedNote.setId(noteId);
        updatedNote.setTitolo("Titolo Modificato");
        updatedNote.setContenuto("Contenuto modificato");
        updatedNote.setProprietario(proprietarioEmail);
        updatedNote.setTag("studio");
        
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(sampleNote));
        when(condivisioneService.hasWritePermission(noteId, proprietarioEmail, proprietarioEmail))
            .thenReturn(true);
        when(tagService.existsByNome("studio")).thenReturn(true);
        when(noteRepository.save(any(Note.class))).thenReturn(updatedNote);
        when(condivisioneService.getCondivisioniByNota(noteId)).thenReturn(
            List.of(new CondivisioneResponse(altroUtenteEmail, TipoCondivisione.scrittura))
        );
        
        // When
        NoteResponse result = noteService.updateNote(noteId, request, proprietarioEmail);
        
        // Then
        assertEquals("Titolo Modificato", result.titolo());
        assertEquals("Contenuto modificato", result.contenuto());
        assertEquals("studio", result.tag());
        
        verify(condivisioneService).updateCondivisioni(noteId, condivisioni, proprietarioEmail);
    }
    
    @Test
    void testUpdateNote_RemoveTag_Success() {
        // Given
        UpdateNoteRequest request = new UpdateNoteRequest(
            "Titolo Modificato",
            "Contenuto modificato",
            null,
            null
        );
        
        Note updatedNote = new Note();
        updatedNote.setId(noteId);
        updatedNote.setTitolo("Titolo Modificato");
        updatedNote.setContenuto("Contenuto modificato");
        updatedNote.setProprietario(proprietarioEmail);
        updatedNote.setTag(null);
        
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(sampleNote));
        when(condivisioneService.hasWritePermission(noteId, proprietarioEmail, proprietarioEmail))
            .thenReturn(true);
        when(noteRepository.save(any(Note.class))).thenReturn(updatedNote);
        when(condivisioneService.getCondivisioniByNota(noteId)).thenReturn(Collections.emptyList());
        
        // When
        NoteResponse result = noteService.updateNote(noteId, request, proprietarioEmail);
        
        // Then
        assertNull(result.tag());
        verify(tagService, never()).existsByNome(anyString());
    }
    
    @Test
    void testUpdateNote_NoWritePermission_ThrowsException() {
        // Given
        UpdateNoteRequest request = new UpdateNoteRequest(
            "Titolo Modificato",
            "Contenuto modificato",
            null,
            null
        );
        
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(sampleNote));
        when(condivisioneService.hasWritePermission(noteId, altroUtenteEmail, proprietarioEmail))
            .thenReturn(false);
        
        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> noteService.updateNote(noteId, request, altroUtenteEmail)
        );
        
        assertEquals("Non hai i permessi per modificare questa nota", exception.getMessage());
    }
    
    @Test
    void testUpdateNote_NonOwnerCannotUpdateCondivisioni() {
        // Given
        List<CondivisioneRequest> condivisioni = List.of(
            new CondivisioneRequest("nuovo@test.com", TipoCondivisione.lettura)
        );
        
        UpdateNoteRequest request = new UpdateNoteRequest(
            "Titolo Modificato",
            "Contenuto modificato",
            null,
            condivisioni
        );
        
        Note updatedNote = new Note();
        updatedNote.setId(noteId);
        updatedNote.setTitolo("Titolo Modificato");
        updatedNote.setContenuto("Contenuto modificato");
        updatedNote.setProprietario(proprietarioEmail);
        
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(sampleNote));
        when(condivisioneService.hasWritePermission(noteId, altroUtenteEmail, proprietarioEmail))
            .thenReturn(true);
        when(noteRepository.save(any(Note.class))).thenReturn(updatedNote);
        when(condivisioneService.getCondivisioniByNota(noteId)).thenReturn(Collections.emptyList());
        
        // When
        noteService.updateNote(noteId, request, altroUtenteEmail);
        
        // Then
        verify(condivisioneService, never()).updateCondivisioni(any(), any(), any());
    }
    
    @Test
    void testDeleteNote_Success() {
        // Given
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(sampleNote));
        
        // When
        noteService.deleteNote(noteId, proprietarioEmail);
        
        // Then
        verify(noteRepository).delete(sampleNote);
    }
    
    @Test
    void testDeleteNote_NotOwner_ThrowsException() {
        // Given
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(sampleNote));
        
        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> noteService.deleteNote(noteId, altroUtenteEmail)
        );
        
        assertEquals("Solo il proprietario può eliminare questa nota", exception.getMessage());
        verify(noteRepository, never()).delete(any());
    }
    
    @Test
    void testDeleteNote_NotFound_ThrowsException() {
        // Given
        when(noteRepository.findById(noteId)).thenReturn(Optional.empty());
        
        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> noteService.deleteNote(noteId, proprietarioEmail)
        );
        
        assertEquals("Nota non trovata", exception.getMessage());
    }
    
    @Test
    void testGetNoteUtente_FiltersDuplicates() {
        // Given
        List<Note> noteProprietario = List.of(sampleNote);
        List<UUID> noteCondiviseIds = List.of(noteId); // Stessa nota condivisa
        
        when(noteRepository.findByProprietarioOrderByDataUltimaModificaDesc(proprietarioEmail))
            .thenReturn(noteProprietario);
        when(condivisioneService.getAccessibleNoteIds(proprietarioEmail))
            .thenReturn(noteCondiviseIds);
        when(noteRepository.findAllById(noteCondiviseIds))
            .thenReturn(List.of(sampleNote));
        
        // When
        List<NoteListResponse> result = noteService.getNoteUtente(proprietarioEmail);
        
        // Then
        assertEquals(1, result.size()); // Solo una nota, no duplicati
        assertEquals("Test Note", result.get(0).titolo());
    }
    
    @Test
    void testCreateNote_WithNullCondivisioni_Success() {
        // Given
        CreateNoteRequest request = new CreateNoteRequest(
            "Nuova Nota",
            "Contenuto della nuova nota",
            null,
            null
        );
        
        when(noteRepository.save(any(Note.class))).thenReturn(sampleNote);
        when(condivisioneService.getCondivisioniByNota(noteId)).thenReturn(Collections.emptyList());
        
        // When
        NoteResponse result = noteService.createNote(request, proprietarioEmail);
        
        // Then
        assertNotNull(result);
        verify(condivisioneService, never()).updateCondivisioni(any(), any(), any());
    }
    
    @Test
    void testCreateNote_WithEmptyCondivisioni_Success() {
        // Given
        CreateNoteRequest request = new CreateNoteRequest(
            "Nuova Nota",
            "Contenuto della nuova nota",
            null,
            Collections.emptyList()
        );
        
        when(noteRepository.save(any(Note.class))).thenReturn(sampleNote);
        when(condivisioneService.getCondivisioniByNota(noteId)).thenReturn(Collections.emptyList());
        
        // When
        NoteResponse result = noteService.createNote(request, proprietarioEmail);
        
        // Then
        assertNotNull(result);
        verify(condivisioneService, never()).updateCondivisioni(any(), any(), any());
    }
}