package com.sweng.nota_bene.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// DTO per la richiesta di modifica nota
public record UpdateNoteRequest(
        @NotBlank(message = "Il titolo è obbligatorio")
        @Size(max = 255, message = "Il titolo non può superare i 255 caratteri")
        String titolo,
        
        @NotBlank(message = "Il contenuto è obbligatorio")
        @Size(max = 280, message = "Il contenuto non può superare i 280 caratteri")
        String contenuto,
        
        String tagId,              // Tag opzionale
        UUID idCartella,           // Cartella opzionale
        List<CondivisioneRequest> condivisioni
) {}
