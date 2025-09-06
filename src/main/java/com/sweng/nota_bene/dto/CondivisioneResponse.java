
package com.sweng.nota_bene.dto;

import com.sweng.nota_bene.model.Condivisione.TipoCondivisione;

/**
 * DTO per rappresentare una condivisione nella risposta
 */
public record CondivisioneResponse(
    String emailUtente,
    TipoCondivisione tipo
) {}
