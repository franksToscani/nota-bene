package com.sweng.nota_bene.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sweng.nota_bene.model.Cartella;
import com.sweng.nota_bene.repository.CartellaRepository;

@RestController
@RequestMapping("/api/cartelle")
public class CartellaController {

    @Autowired
    private CartellaRepository cartellaRepository;

    @GetMapping
    public List<Cartella> getCartelle(@RequestParam String proprietario) {
        return cartellaRepository.findByProprietario(proprietario);
    }

    @PostMapping
    public Cartella creaCartella(@RequestBody Cartella cartella) {
        // JPA genera automaticamente l'UUID
        return cartellaRepository.save(cartella);
    }
}