package com.sweng.nota_bene;

import com.sweng.nota_bene.service.CondivisioneService;
import com.sweng.nota_bene.service.UserService;
import com.sweng.nota_bene.dto.CondivisioneRequest;
import com.sweng.nota_bene.dto.CondivisioneResponse;
import com.sweng.nota_bene.model.Condivisione;
import com.sweng.nota_bene.model.Condivisione.TipoCondivisione;
import com.sweng.nota_bene.repository.CondivisioneRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CondivisioneServiceTest {

    @Mock
    private CondivisioneRepository condivisioneRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private CondivisioneService condivisioneService;

    @Test
    void updateCondivisioni_success() {
        UUID idNota = UUID.randomUUID();
        List<CondivisioneRequest> nuove = new ArrayList<>();
        nuove.add(new CondivisioneRequest("user1@example.com", TipoCondivisione.lettura));
        nuove.add(new CondivisioneRequest("user2@example.com", TipoCondivisione.scrittura));

        when(userService.validateUsersExist(anyList())).thenReturn(null);

        condivisioneService.updateCondivisioni(idNota, nuove, "owner@example.com");

        verify(condivisioneRepository, times(1)).deleteByIdNota(idNota);
        verify(condivisioneRepository, times(2)).save(any(Condivisione.class));
    }

    @Test
    void updateCondivisioni_selfShare_throwsException() {
        UUID idNota = UUID.randomUUID();
        List<CondivisioneRequest> nuove = new ArrayList<>();
        nuove.add(new CondivisioneRequest("owner@example.com", TipoCondivisione.lettura));

        IllegalArgumentException ex = assertThrows(
            IllegalArgumentException.class,
            () -> condivisioneService.updateCondivisioni(idNota, nuove, "owner@example.com")
        );

        assertEquals("Non puoi condividere la nota con te stesso", ex.getMessage());
        verify(condivisioneRepository, never()).deleteByIdNota(any());
        verify(condivisioneRepository, never()).save(any());
    }

    @Test
    void updateCondivisioni_invalidUser_throwsException() {
        UUID idNota = UUID.randomUUID();
        List<CondivisioneRequest> nuove = new ArrayList<>();
        nuove.add(new CondivisioneRequest("bad@example.com", TipoCondivisione.lettura));

        when(userService.validateUsersExist(anyList())).thenReturn("bad@example.com");

        IllegalArgumentException ex = assertThrows(
            IllegalArgumentException.class,
            () -> condivisioneService.updateCondivisioni(idNota, nuove, "owner@example.com")
        );

        assertEquals("L'utente con email bad@example.com non esiste nel sistema", ex.getMessage());
        verify(condivisioneRepository, never()).save(any());
    }

    @Test
    void getCondivisioniByNota_success() {
        UUID idNota = UUID.randomUUID();
        Condivisione c1 = new Condivisione(idNota, "user1@example.com", TipoCondivisione.lettura);
        Condivisione c2 = new Condivisione(idNota, "user2@example.com", TipoCondivisione.scrittura);

        List<Condivisione> listaCondivisioni = new ArrayList<>();
        listaCondivisioni.add(c1);
        listaCondivisioni.add(c2);

        when(condivisioneRepository.findByIdNota(idNota)).thenReturn(listaCondivisioni);

        List<CondivisioneResponse> result = condivisioneService.getCondivisioniByNota(idNota);

        assertEquals(2, result.size());
        assertEquals("user1@example.com", result.get(0).emailUtente());
        assertEquals(TipoCondivisione.lettura, result.get(0).tipo());
    }

    @Test
    void hasReadPermission_ownerAlwaysTrue() {
        UUID idNota = UUID.randomUUID();
        boolean result = condivisioneService.hasReadPermission(idNota, "owner@example.com", "owner@example.com");
        assertTrue(result);
        verify(condivisioneRepository, never()).existsByIdNotaAndEmailUtente(any(), any());
    }

    @Test
    void hasReadPermission_checksRepository() {
        UUID idNota = UUID.randomUUID();
        when(condivisioneRepository.existsByIdNotaAndEmailUtente(idNota, "user@example.com")).thenReturn(true);

        boolean result = condivisioneService.hasReadPermission(idNota, "user@example.com", "owner@example.com");

        assertTrue(result);
        verify(condivisioneRepository, times(1)).existsByIdNotaAndEmailUtente(idNota, "user@example.com");
    }

    @Test
    void hasWritePermission_ownerAlwaysTrue() {
        UUID idNota = UUID.randomUUID();
        boolean result = condivisioneService.hasWritePermission(idNota, "owner@example.com", "owner@example.com");
        assertTrue(result);
        verify(condivisioneRepository, never()).hasWritePermission(any(), any());
    }

    @Test
    void hasWritePermission_checksRepository() {
        UUID idNota = UUID.randomUUID();
        when(condivisioneRepository.hasWritePermission(idNota, "user@example.com")).thenReturn(true);

        boolean result = condivisioneService.hasWritePermission(idNota, "user@example.com", "owner@example.com");

        assertTrue(result);
        verify(condivisioneRepository, times(1)).hasWritePermission(idNota, "user@example.com");
    }

    @Test
    void getAccessibleNoteIds_success() {
        List<UUID> expected = new ArrayList<>();
        expected.add(UUID.randomUUID());
        expected.add(UUID.randomUUID());

        when(condivisioneRepository.findAccessibleNoteIds("user@example.com")).thenReturn(expected);

        List<UUID> result = condivisioneService.getAccessibleNoteIds("user@example.com");

        assertEquals(expected, result);
    }

    @Test
    void addCondivisione_newShare_success() {
        UUID idNota = UUID.randomUUID();

        when(userService.existsByEmail("user@example.com")).thenReturn(true);
        when(condivisioneRepository.findByIdNotaAndEmailUtente(idNota, "user@example.com"))
            .thenReturn(Optional.empty());

        condivisioneService.addCondivisione(idNota, "user@example.com", TipoCondivisione.scrittura, "owner@example.com");

        verify(condivisioneRepository, times(1)).save(any(Condivisione.class));
    }

    @Test
    void addCondivisione_existingShare_updatesType() {
        UUID idNota = UUID.randomUUID();
        Condivisione existing = new Condivisione(idNota, "user@example.com", TipoCondivisione.lettura);

        when(userService.existsByEmail("user@example.com")).thenReturn(true);
        when(condivisioneRepository.findByIdNotaAndEmailUtente(idNota, "user@example.com"))
            .thenReturn(Optional.of(existing));

        condivisioneService.addCondivisione(idNota, "user@example.com", TipoCondivisione.scrittura, "owner@example.com");

        assertEquals(TipoCondivisione.scrittura, existing.getTipo());
        verify(condivisioneRepository, times(1)).save(existing);
    }

    @Test
    void addCondivisione_selfShare_throwsException() {
        UUID idNota = UUID.randomUUID();

        IllegalArgumentException ex = assertThrows(
            IllegalArgumentException.class,
            () -> condivisioneService.addCondivisione(idNota, "owner@example.com", TipoCondivisione.lettura, "owner@example.com")
        );

        assertEquals("Non puoi condividere la nota con te stesso", ex.getMessage());
    }

    @Test
    void addCondivisione_userNotExists_throwsException() {
        UUID idNota = UUID.randomUUID();

        when(userService.existsByEmail("ghost@example.com")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(
            IllegalArgumentException.class,
            () -> condivisioneService.addCondivisione(idNota, "ghost@example.com", TipoCondivisione.lettura, "owner@example.com")
        );

        assertEquals("L'utente con email ghost@example.com non esiste nel sistema", ex.getMessage());
    }

    @Test
    void removeCondivisione_success() {
        UUID idNota = UUID.randomUUID();

        condivisioneService.removeCondivisione(idNota, "user@example.com");

        verify(condivisioneRepository, times(1)).deleteByIdNotaAndEmailUtente(idNota, "user@example.com");
    }

    @Test
    void canManagePermissions_ownerTrue() {
        assertTrue(condivisioneService.canManagePermissions("owner@example.com", "owner@example.com"));
    }

    @Test
    void canManagePermissions_nonOwnerFalse() {
        assertFalse(condivisioneService.canManagePermissions("user@example.com", "owner@example.com"));
    }
}

