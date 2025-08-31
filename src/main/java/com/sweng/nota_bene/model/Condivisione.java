package com.sweng.nota_bene.model;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "condivisione")
public class Condivisione {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "id_nota", nullable = false)
    private UUID idNota;

    @Column(name = "email_utente", nullable = false)
    private String emailUtente;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoCondivisione tipo;

    // Relazione con Note (opzionale per query più efficienti)
    @ManyToOne
    @JoinColumn(name = "id_nota", insertable = false, updatable = false)
    private Note nota;

    // Constructors
    public Condivisione() {}

    public Condivisione(UUID idNota, String emailUtente, TipoCondivisione tipo) {
        this.idNota = idNota;
        this.emailUtente = emailUtente;
        this.tipo = tipo;
    }

    // Getters
    public UUID getId() { return id; }
    public UUID getIdNota() { return idNota; }
    public String getEmailUtente() { return emailUtente; }
    public TipoCondivisione getTipo() { return tipo; }
    public Note getNota() { return nota; }

    // Setters
    public void setId(UUID id) { this.id = id; }
    public void setIdNota(UUID idNota) { this.idNota = idNota; }
    public void setEmailUtente(String emailUtente) { this.emailUtente = emailUtente; }
    public void setTipo(TipoCondivisione tipo) { this.tipo = tipo; }
    public void setNota(Note nota) { this.nota = nota; }

    // Enum per i tipi di condivisione
    public enum TipoCondivisione {
        lettura, scrittura
    }
}