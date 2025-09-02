package com.sweng.nota_bene.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.sweng.nota_bene.dto.NoteListResponse;
import com.sweng.nota_bene.model.Note;
import com.sweng.nota_bene.repository.NoteRepository;

@ExtendWith(MockitoExtension.class)
class NoteServiceSearchTest {

    @Mock
    private NoteRepository noteRepository;

    @Mock
    private TagService tagService;

    @Mock
    private CondivisioneService condivisioneService;

    @InjectMocks
    private NoteService noteService;

    @Test
    void searchAccessibleNotesReturnsMappedResults() {
        String email = "user@test.com";
        LocalDateTime createdFrom = LocalDateTime.of(2023, 1, 1, 0, 0);
        LocalDateTime createdTo = LocalDateTime.of(2023, 12, 31, 0, 0);
        LocalDateTime modifiedFrom = LocalDateTime.of(2023, 2, 1, 0, 0);
        LocalDateTime modifiedTo = LocalDateTime.of(2023, 2, 28, 0, 0);

        Note note = new Note();
        note.setId(UUID.randomUUID());
        note.setTitolo("Titolo");
        note.setContenuto("Contenuto");
        note.setProprietario(email);

        when(noteRepository.searchAccessibleNotes(email, createdFrom, createdTo, modifiedFrom, modifiedTo))
                .thenReturn(List.of(note));

        List<NoteListResponse> result = noteService.searchAccessibleNotes(email, createdFrom, createdTo, modifiedFrom, modifiedTo);

        assertEquals(1, result.size());
        assertEquals("Titolo", result.get(0).titolo());
        verify(noteRepository).searchAccessibleNotes(email, createdFrom, createdTo, modifiedFrom, modifiedTo);
    }
}
