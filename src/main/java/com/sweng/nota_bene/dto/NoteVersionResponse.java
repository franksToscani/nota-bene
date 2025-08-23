package com.sweng.nota_bene.dto;

import java.time.LocalDateTime;
import java.util.UUID;

// DTO per la risposta delle versioni della nota
public record NoteVersionResponse(
        UUID id,
        UUID notaId,
        String titolo,
        String contenuto,
        LocalDateTime dataModifica,
        String creatore
) {}