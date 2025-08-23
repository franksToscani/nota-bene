package com.sweng.nota_bene.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "tag")
public class Tag {
    @Id
    @Column(nullable = false)
    private String nome;

    // Getters
    public String getNome() { return nome; }

    // Setters
    public void setNome(String nome) { this.nome = nome; }
}