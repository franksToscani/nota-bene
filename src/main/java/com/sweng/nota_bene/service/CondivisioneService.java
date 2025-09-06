package com.sweng.nota_bene.service;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sweng.nota_bene.dto.CondivisioneRequest;
import com.sweng.nota_bene.dto.CondivisioneResponse;
import com.sweng.nota_bene.model.Condivisione;
import com.sweng.nota_bene.model.Condivisione.TipoCondivisione;
import com.sweng.nota_bene.repository.CondivisioneRepository;

@Service
@Transactional
public class CondivisioneService {

    @Autowired
    private CondivisioneRepository condivisioneRepository;
    
    @Autowired
    private UserService userService;

    /**
     * Aggiorna le condivisioni per una nota
     * Elimina quelle esistenti e crea quelle nuove
     * Valida che tutti gli utenti esistano e che il proprietario non si condivida la nota
     */
    public void updateCondivisioni(UUID idNota, List<CondivisioneRequest> nuoveCondivisioni, String proprietarioEmail) {
        // Valida che tutti gli utenti esistano e che il proprietario non sia nella lista
        if (nuoveCondivisioni != null && !nuoveCondivisioni.isEmpty()) {
            List<String> emails = nuoveCondivisioni.stream()
                .map(CondivisioneRequest::emailUtente)
                .toList();
            
            // Controlla se il proprietario sta tentando di condividere con se stesso
            if (emails.contains(proprietarioEmail)) {
                throw new IllegalArgumentException("Non puoi condividere la nota con te stesso");
            }
            
            String invalidEmail = userService.validateUsersExist(emails);
            if (invalidEmail != null) {
                throw new IllegalArgumentException("L'utente con email " + invalidEmail + " non esiste nel sistema");
            }
        }
        
        // Elimina le condivisioni esistenti
        condivisioneRepository.deleteByIdNota(idNota);
        
        // Crea le nuove condivisioni
        if (nuoveCondivisioni != null && !nuoveCondivisioni.isEmpty()) {
            for (CondivisioneRequest request : nuoveCondivisioni) {
                Condivisione condivisione = new Condivisione(
                    idNota,
                    request.emailUtente(),
                    request.tipo()
                );
                condivisioneRepository.save(condivisione);
            }
        }
    }

    /**
     * Ottiene tutte le condivisioni per una nota
     */
    public List<CondivisioneResponse> getCondivisioniByNota(UUID idNota) {
        List<Condivisione> condivisioni = condivisioneRepository.findByIdNota(idNota);
        
        return condivisioni.stream()
            .map(c -> new CondivisioneResponse(c.getEmailUtente(), c.getTipo()))
            .toList();
    }

    /**
     * Verifica se un utente ha accesso in lettura a una nota
     */
    public boolean hasReadPermission(UUID idNota, String emailUtente, String proprietarioNota) {
        // Il proprietario ha sempre accesso
        if (emailUtente.equals(proprietarioNota)) {
            return true;
        }
        
        // Verifica se l'utente ha una condivisione (lettura o scrittura)
        return condivisioneRepository.existsByIdNotaAndEmailUtente(idNota, emailUtente);
    }

    /**
     * Verifica se un utente ha accesso in scrittura a una nota
     */
    public boolean hasWritePermission(UUID idNota, String emailUtente, String proprietarioNota) {
        // Il proprietario ha sempre accesso
        if (emailUtente.equals(proprietarioNota)) {
            return true;
        }
        
        // Verifica se l'utente ha permessi specifici di scrittura
        return condivisioneRepository.hasWritePermission(idNota, emailUtente);
    }

    /**
     * Ottiene tutti gli ID delle note accessibili a un utente (proprie + condivise)
     */
    public List<UUID> getAccessibleNoteIds(String emailUtente) {
        return condivisioneRepository.findAccessibleNoteIds(emailUtente);
    }

    /**
     * Aggiunge una condivisione a una nota
     * Valida che l'utente esista e che non sia il proprietario
     */
    public void addCondivisione(UUID idNota, String emailUtente, TipoCondivisione tipo, String proprietarioEmail) {
        // Verifica che l'utente non sia il proprietario
        if (emailUtente.equals(proprietarioEmail)) {
            throw new IllegalArgumentException("Non puoi condividere la nota con te stesso");
        }
        
        // Verifica che l'utente esista
        if (!userService.existsByEmail(emailUtente)) {
            throw new IllegalArgumentException("L'utente con email " + emailUtente + " non esiste nel sistema");
        }
        
        // Verifica se la condivisione esiste già
        var esistente = condivisioneRepository.findByIdNotaAndEmailUtente(idNota, emailUtente);
        
        if (esistente.isPresent()) {
            // Aggiorna il tipo di condivisione esistente
            Condivisione condivisione = esistente.get();
            condivisione.setTipo(tipo);
            condivisioneRepository.save(condivisione);
        } else {
            // Crea una nuova condivisione
            Condivisione nuovaCondivisione = new Condivisione(idNota, emailUtente, tipo);
            condivisioneRepository.save(nuovaCondivisione);
        }
    }

    /**
     * Rimuove una condivisione
     */
    public void removeCondivisione(UUID idNota, String emailUtente) {
        condivisioneRepository.deleteByIdNotaAndEmailUtente(idNota, emailUtente);
    }

    /**
     * Verifica se un utente può gestire i permessi di una nota (solo il proprietario)
     */
    public boolean canManagePermissions(String emailUtente, String proprietarioNota) {
        return emailUtente.equals(proprietarioNota);
    }
}