package com.sweng.nota_bene.dto;

// DTO per la risposta con i tag disponibili
public record TagResponse(
    String nome  
) {
    public static TagResponse from(String nome) {
        return new TagResponse(nome);
    }
}