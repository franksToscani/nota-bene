package com.sweng.nota_bene.model;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "nota")
public class Note {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = true)
    private String titolo;

    @Column(nullable = true, length = 280)
    private String contenuto;

    @Column(nullable = false)
    private String proprietario;

    @Column(name = "data_creazione", nullable = false)
    private OffsetDateTime dataCreazione;

    @Column(name = "data_ultima_modifica", nullable = false)
    private OffsetDateTime dataUltimaModifica;

    @Column(name = "id_cartella")
    private UUID idCartella;

    @Column(nullable = true)
    private String tag;

    @PrePersist
    protected void onCreate() {
        dataCreazione = OffsetDateTime.now(ZoneOffset.UTC);
        dataUltimaModifica = OffsetDateTime.now(ZoneOffset.UTC);
    }

    @PreUpdate
    protected void onUpdate() {
        dataUltimaModifica = OffsetDateTime.now(ZoneOffset.UTC);

    }

    // Getters
    public UUID getId() { return id; }
    public String getTitolo() { return titolo; }
    public String getContenuto() { return contenuto; }
    public String getProprietario() { return proprietario; }
     public OffsetDateTime getDataCreazione() { return dataCreazione; }
    public OffsetDateTime getDataUltimaModifica() { return dataUltimaModifica; }
    public UUID getIdCartella() { return idCartella; }
    public String getTag() { return tag; }

    // Setters
    public void setId(UUID id) { this.id = id; }
    public void setTitolo(String titolo) { this.titolo = titolo; }
    public void setContenuto(String contenuto) { this.contenuto = contenuto; }
    public void setProprietario(String proprietario) { this.proprietario = proprietario; }
    public void setDataCreazione(OffsetDateTime dataCreazione) { this.dataCreazione = dataCreazione; }
    public void setDataUltimaModifica(OffsetDateTime dataUltimaModifica) { this.dataUltimaModifica = dataUltimaModifica; }
    public void setIdCartella(UUID idCartella) { this.idCartella = idCartella; }
    public void setTag(String tag) { this.tag = tag; }
}