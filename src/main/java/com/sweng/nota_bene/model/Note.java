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
    private String titolo; // Titolo della nota

    @Column(nullable = true, length = 280)
    private String contenuto; // Contenuto massimo 280 caratteri

    @Column(nullable = false)
    private String proprietario; // Email del proprietario

    @Column(name = "data_creazione", nullable = false)
    private OffsetDateTime dataCreazione;

    @Column(name = "data_ultima_modifica", nullable = false)
    private OffsetDateTime dataUltimaModifica;

    @Column(name = "id_cartella", nullable = true)
    private UUID idCartella; // UUID della cartella associata (può essere null)

    @Column(nullable = true)
    private String tag; // Nome del tag associato alla nota

    // Imposta le date di creazione e ultima modifica al momento della persistenza
    @PrePersist
    protected void onCreate() {
        dataCreazione = OffsetDateTime.now(ZoneOffset.UTC);
        dataUltimaModifica = OffsetDateTime.now(ZoneOffset.UTC);
    }

    // Aggiorna la data di ultima modifica ad ogni update
    @PreUpdate
    protected void onUpdate() {
        dataUltimaModifica = OffsetDateTime.now(ZoneOffset.UTC);

    }

    // =======================
    // Getters
    // =======================
    public UUID getId() { return id; }
    public String getTitolo() { return titolo; }
    public String getContenuto() { return contenuto; }
    public String getProprietario() { return proprietario; }
     public OffsetDateTime getDataCreazione() { return dataCreazione; }
    public OffsetDateTime getDataUltimaModifica() { return dataUltimaModifica; }
    public UUID getIdCartella() { return idCartella; }
    public String getTag() { return tag; }

    // =======================
    // Setters
    // =======================
    public void setId(UUID id) { this.id = id; }
    public void setTitolo(String titolo) { this.titolo = titolo; }
    public void setContenuto(String contenuto) { this.contenuto = contenuto; }
    public void setProprietario(String proprietario) { this.proprietario = proprietario; }
    public void setDataCreazione(OffsetDateTime dataCreazione) { this.dataCreazione = dataCreazione; }
    public void setDataUltimaModifica(OffsetDateTime dataUltimaModifica) { this.dataUltimaModifica = dataUltimaModifica; }
    public void setIdCartella(UUID idCartella) { this.idCartella = idCartella; }
    public void setTag(String tag) { this.tag = tag; }
}
