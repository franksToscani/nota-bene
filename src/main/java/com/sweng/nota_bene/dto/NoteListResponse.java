package com.sweng.nota_bene.dto;

import java.util.UUID;

// DTO semplificato per le liste
public record NoteListResponse(
        UUID id,
        String titolo,
        String contenuto,
        java.time.OffsetDateTime dataCreazione,
        java.time.OffsetDateTime dataUltimaModifica,
        String tag,
        String proprietario,
        UUID idCartella
) {}
