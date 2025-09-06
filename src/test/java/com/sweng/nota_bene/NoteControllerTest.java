package com.sweng.nota_bene;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import com.sweng.nota_bene.controller.NoteController;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import com.sweng.nota_bene.dto.NoteListResponse;
import com.sweng.nota_bene.dto.UserResponse;
import com.sweng.nota_bene.service.NoteService;

@WebMvcTest(NoteController.class)
@AutoConfigureMockMvc(addFilters = false)
class NoteControllerTest {

    @TestConfiguration
    static class MockConfig {
        @Bean
        NoteService noteService() {
            return Mockito.mock(NoteService.class);
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private NoteService noteService;

    @BeforeEach
    void setUpSecurityContext() {
        UserResponse principal = new UserResponse("user@example.com", "nick");
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void searchNotesShouldConvertDatesToStartAndEndOfDay() throws Exception {
        OffsetDateTime createdFromODT = OffsetDateTime.of(2024, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC);
        OffsetDateTime createdToODT = OffsetDateTime.of(2024, 1, 2, 23, 59, 59, 0, ZoneOffset.UTC);
        OffsetDateTime modifiedFromODT = OffsetDateTime.of(2024, 1, 3, 0, 0, 0, 0, ZoneOffset.UTC);
        OffsetDateTime modifiedToODT = OffsetDateTime.of(2024, 1, 4, 23, 59, 59, 0, ZoneOffset.UTC);

        UUID cartellaId1 = UUID.randomUUID();
        UUID cartellaId2 = UUID.randomUUID();

        NoteListResponse note1 = new NoteListResponse(
                UUID.randomUUID(),
                "Nota 1",
                "Contenuto",
                modifiedFromODT,
                modifiedToODT,
                "tag1",
                "user@example.com",
                cartellaId1              // <— 8° parametro richiesto
        );

        NoteListResponse note2 = new NoteListResponse(
                UUID.randomUUID(),
                "Nota 2",
                "Contenuto",
                createdToODT,
                modifiedToODT,
                "tag2",
                "user@example.com",
                cartellaId2              // <— 8° parametro richiesto
        );

        when(noteService.searchNotes(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(note1, note2));

        mockMvc.perform(get("/api/note/search")
                        .param("createdFrom", createdFromODT.toLocalDate().toString())
                        .param("createdTo", createdToODT.toLocalDate().toString())
                        .param("modifiedFrom", modifiedFromODT.toLocalDate().toString())
                        .param("modifiedTo", modifiedToODT.toLocalDate().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.note", hasSize(2)));

        verify(noteService).searchNotes(
                eq("user@example.com"),
                isNull(),          // searchTerm
                isNull(),          // tag
                eq(createdFromODT),
                eq(createdToODT),
                eq(modifiedFromODT),
                eq(modifiedToODT)
        );
    }

    @Test
    void searchNotesWithSomeNullParameters() throws Exception {
        OffsetDateTime createdToODT = OffsetDateTime.of(2024, 6, 30, 23, 59, 59, 0, ZoneOffset.UTC);

        when(noteService.searchNotes(any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/note/search")
                        .param("searchTerm", "test")
                        .param("createdTo", createdToODT.toLocalDate().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.note", hasSize(0)));

        verify(noteService).searchNotes(
                eq("user@example.com"),
                eq("test"),
                isNull(),
                isNull(),
                eq(createdToODT),
                isNull(),
                isNull()
        );
    }
}