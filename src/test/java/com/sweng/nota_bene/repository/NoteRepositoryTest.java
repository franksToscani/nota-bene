package com.sweng.nota_bene.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import com.sweng.nota_bene.model.Condivisione;
import com.sweng.nota_bene.model.Note;

@DataJpaTest
class NoteRepositoryTest {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private CondivisioneRepository condivisioneRepository;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    private static final String USER = "user@test.com";
    private static final String OTHER = "other@test.com";

    private Note noteA;
    private Note noteB;
    private Note noteC;

    @BeforeEach
    void setup() {
        condivisioneRepository.deleteAll();
        noteRepository.deleteAll();

        noteA = new Note();
        noteA.setTitolo("A");
        noteA.setContenuto("A");
        noteA.setProprietario(USER);
        persistWithDates(noteA, LocalDateTime.of(2023, 1, 1, 0, 0), LocalDateTime.of(2023, 1, 10, 0, 0));

        noteB = new Note();
        noteB.setTitolo("B");
        noteB.setContenuto("B");
        noteB.setProprietario(OTHER);
        persistWithDates(noteB, LocalDateTime.of(2023, 2, 1, 0, 0), LocalDateTime.of(2023, 2, 10, 0, 0));
        condivisioneRepository.save(new Condivisione(noteB.getId(), USER, Condivisione.TipoCondivisione.lettura));

        noteC = new Note();
        noteC.setTitolo("C");
        noteC.setContenuto("C");
        noteC.setProprietario(USER);
        persistWithDates(noteC, LocalDateTime.of(2023, 3, 1, 0, 0), LocalDateTime.of(2023, 3, 10, 0, 0));
    }

    private void persistWithDates(Note note, LocalDateTime created, LocalDateTime modified) {
        noteRepository.save(note);
        entityManager.flush();
        entityManager.createNativeQuery("UPDATE nota SET data_creazione = ?, data_ultima_modifica = ? WHERE id = ?")
                .setParameter(1, Timestamp.valueOf(created))
                .setParameter(2, Timestamp.valueOf(modified))
                .setParameter(3, note.getId())
                .executeUpdate();
        entityManager.clear();
    }

    @Test
    void searchByCreatedFrom() {
        List<Note> result = noteRepository.searchAccessibleNotes(USER,
                LocalDateTime.of(2023, 2, 1, 0, 0), null, null, null);
        assertEquals(List.of(noteC.getId(), noteB.getId()),
                result.stream().map(Note::getId).toList());
    }

    @Test
    void searchByCreatedTo() {
        List<Note> result = noteRepository.searchAccessibleNotes(USER,
                null, LocalDateTime.of(2023, 2, 28, 23, 59), null, null);
        assertEquals(List.of(noteB.getId(), noteA.getId()),
                result.stream().map(Note::getId).toList());
    }

    @Test
    void searchByModifiedFrom() {
        List<Note> result = noteRepository.searchAccessibleNotes(USER,
                null, null, LocalDateTime.of(2023, 3, 1, 0, 0), null);
        assertEquals(List.of(noteC.getId()),
                result.stream().map(Note::getId).toList());
    }

    @Test
    void searchByModifiedTo() {
        List<Note> result = noteRepository.searchAccessibleNotes(USER,
                null, null, null, LocalDateTime.of(2023, 2, 9, 0, 0));
        assertEquals(List.of(noteA.getId()),
                result.stream().map(Note::getId).toList());
    }

    @Test
    void searchByCreatedAndModifiedRange() {
        List<Note> result = noteRepository.searchAccessibleNotes(USER,
                LocalDateTime.of(2023, 2, 1, 0, 0),
                LocalDateTime.of(2023, 2, 15, 0, 0),
                LocalDateTime.of(2023, 2, 1, 0, 0),
                LocalDateTime.of(2023, 3, 5, 0, 0));
        assertEquals(List.of(noteB.getId()),
                result.stream().map(Note::getId).toList());
    }
}
