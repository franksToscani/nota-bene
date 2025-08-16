package com.sweng.nota_bene.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 3, max = 20) String nickname,
        @NotBlank @Size(min = 6, max = 100) String password
) {}
