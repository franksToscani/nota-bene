package com.sweng.nota_bene.controller;

import com.sweng.nota_bene.model.Cartella;
import com.sweng.nota_bene.repository.CartellaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cartelle")
public class CartellaController {

    @Autowired
    private CartellaRepository cartellaRepository;

    // Endpoint per ottenere tutte le cartelle di un proprietario
    @GetMapping
    public List<Cartella> getCartelle(@RequestParam String proprietario) {
        return cartellaRepository.findByProprietario(proprietario);
    }

    // Endpoint per creare una nuova cartella
    @PostMapping
    public Cartella creaCartella(@RequestBody Cartella cartella) {
        // JPA genera automaticamente l'UUID
        return cartellaRepository.save(cartella);
    }
}