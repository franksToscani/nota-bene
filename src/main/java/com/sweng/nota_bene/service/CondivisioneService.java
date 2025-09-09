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

    public void updateCondivisioni(UUID idNota, List<CondivisioneRequest> nuoveCondivisioni, String proprietarioEmail) {
        if (nuoveCondivisioni != null && !nuoveCondivisioni.isEmpty()) {
            List<String> emails = nuoveCondivisioni.stream()
                .map(CondivisioneRequest::emailUtente)
                .toList();

            if (emails.contains(proprietarioEmail)) {
                throw new IllegalArgumentException("Non puoi condividere la nota con te stesso");
            }
            
            String invalidEmail = userService.validateUsersExist(emails);
            if (invalidEmail != null) {
                throw new IllegalArgumentException("L'utente con email " + invalidEmail + " non esiste nel sistema");
            }
        }

        condivisioneRepository.deleteByIdNota(idNota);

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

    public List<CondivisioneResponse> getCondivisioniByNota(UUID idNota) {
        List<Condivisione> condivisioni = condivisioneRepository.findByIdNota(idNota);
        
        return condivisioni.stream()
            .map(c -> new CondivisioneResponse(c.getEmailUtente(), c.getTipo()))
            .toList();
    }

    public boolean hasReadPermission(UUID idNota, String emailUtente, String proprietarioNota) {

        if (emailUtente.equals(proprietarioNota)) {
            return true;
        }

        return condivisioneRepository.existsByIdNotaAndEmailUtente(idNota, emailUtente);
    }

    public boolean hasWritePermission(UUID idNota, String emailUtente, String proprietarioNota) {
        if (emailUtente.equals(proprietarioNota)) {
            return true;
        }
        
        return condivisioneRepository.hasWritePermission(idNota, emailUtente);
    }

    public List<UUID> getAccessibleNoteIds(String emailUtente) {
        return condivisioneRepository.findAccessibleNoteIds(emailUtente);
    }

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
            Condivisione condivisione = esistente.get();
            condivisione.setTipo(tipo);
            condivisioneRepository.save(condivisione);
        } else {
            Condivisione nuovaCondivisione = new Condivisione(idNota, emailUtente, tipo);
            condivisioneRepository.save(nuovaCondivisione);
        }
    }

    public void removeCondivisione(UUID idNota, String emailUtente) {
        condivisioneRepository.deleteByIdNotaAndEmailUtente(idNota, emailUtente);
    }

    public boolean canManagePermissions(String emailUtente, String proprietarioNota) {
        return emailUtente.equals(proprietarioNota);
    }
}