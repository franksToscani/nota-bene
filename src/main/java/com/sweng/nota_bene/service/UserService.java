package com.sweng.nota_bene.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.sweng.nota_bene.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Verifica se un utente esiste tramite email
     */
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    /**
     * Valida una lista di email utenti
     * Restituisce la prima email non valida trovata, null se tutte sono valide
     */
    public String validateUsersExist(java.util.List<String> emails) {
        for (String email : emails) {
            if (!existsByEmail(email)) {
                return email;
            }
        }
        return null;
    }
}