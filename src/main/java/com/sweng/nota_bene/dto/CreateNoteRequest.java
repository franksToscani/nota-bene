package com.sweng.nota_bene.dto;

import java.util.UUID;

import jakarta.validation.constraints.Size;

// DTO per la richiesta di creazione nota
public record CreateNoteRequest(
        @Size(max = 100) String titolo,
        @Size(max = 280, message = "Il contenuto non può superare i 280 caratteri") String contenuto,
        UUID idCartella,
        String tag
) {}