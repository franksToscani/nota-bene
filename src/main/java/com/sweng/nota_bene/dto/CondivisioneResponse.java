
package com.sweng.nota_bene.dto;

import com.sweng.nota_bene.model.Condivisione.TipoCondivisione;

public record CondivisioneResponse(
    String emailUtente,
    TipoCondivisione tipo
) {}
