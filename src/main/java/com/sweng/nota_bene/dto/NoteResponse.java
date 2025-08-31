package com.sweng.nota_bene.dto;

import java.util.List;
import java.util.UUID;
public record NoteResponse(
        UUID id,
        String titolo,
        String contenuto,
        String proprietario,
        java.time.LocalDateTime dataCreazione,
        java.time.LocalDateTime dataUltimaModifica,
        UUID idCartella,
        String tag,
        List<CondivisioneResponse> condivisioni

) {}