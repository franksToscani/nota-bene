package com.sweng.nota_bene.model;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "versione_nota")
public class NoteVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "nota_id", nullable = false)
    private UUID notaId;

    @Column(nullable = true)
    private String titolo;

    @Column(nullable = true, length = 280)
    private String contenuto;

    @Column(name = "data_modifica", nullable = false)
    private LocalDateTime dataModifica;

    @Column(nullable = false)
    private String creatore;

    @PrePersist
    protected void onCreate() {
        dataModifica = LocalDateTime.now();
    }

    // Getters
    public UUID getId() { return id; }
    public UUID getNotaId() { return notaId; }
    public String getTitolo() { return titolo; }
    public String getContenuto() { return contenuto; }
    public LocalDateTime getDataModifica() { return dataModifica; }
    public String getCreatore() { return creatore; }

    // Setters
    public void setId(UUID id) { this.id = id; }
    public void setNotaId(UUID notaId) { this.notaId = notaId; }
    public void setTitolo(String titolo) { this.titolo = titolo; }
    public void setContenuto(String contenuto) { this.contenuto = contenuto; }
    public void setDataModifica(LocalDateTime dataModifica) { this.dataModifica = dataModifica; }
    public void setCreatore(String creatore) { this.creatore = creatore; }
}