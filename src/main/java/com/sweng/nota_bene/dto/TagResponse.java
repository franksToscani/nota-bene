package com.sweng.nota_bene.dto;

// DTO per la risposta con i tag disponibili
public record TagResponse(
    String id,   // Il nome del tag (usato come ID nel frontend)
    String nome  // Il nome visualizzato
) {
    public static TagResponse from(String nome) {
        return new TagResponse(nome, nome);
    }
}