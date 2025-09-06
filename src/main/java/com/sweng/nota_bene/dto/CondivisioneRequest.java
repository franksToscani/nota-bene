package com.sweng.nota_bene.dto;

import com.sweng.nota_bene.model.Condivisione.TipoCondivisione;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CondivisioneRequest(
    @NotBlank(message = "Email utente obbligatoria")
    @Email(message = "Email non valida")
    String emailUtente,
    
    @NotNull(message = "Tipo condivisione obbligatorio")
    TipoCondivisione tipo
) {}
