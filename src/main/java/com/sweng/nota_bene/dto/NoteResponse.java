package com.sweng.nota_bene.dto;

import java.util.UUID;

// DTO per la risposta con i dettagli della nota
public record NoteResponse(
        UUID id,
        String titolo,
        String contenuto,
        String proprietario,
        java.time.LocalDateTime dataCreazione,
        java.time.LocalDateTime dataUltimaModifica,
        UUID idCartella,
        String tag
) {}