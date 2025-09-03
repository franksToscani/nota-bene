package com.sweng.nota_bene.model;

import java.time.LocalDateTime;
import java.time.ZoneId;
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
    private LocalDateTime dataCreazione;

    @Column(name = "data_ultima_modifica", nullable = false)
    private LocalDateTime dataUltimaModifica;

    @Column(name = "id_cartella", nullable = true)
    private UUID idCartella; // UUID della cartella associata (può essere null)

    @Column(nullable = true)
    private String tag; // Nome del tag associato alla nota

    // Imposta le date di creazione e ultima modifica al momento della persistenza
    @PrePersist
    protected void onCreate() {
        ZoneId zoneId = ZoneId.of("Europe/Rome");
        dataCreazione = LocalDateTime.now(zoneId);
        dataUltimaModifica = LocalDateTime.now(zoneId);
    }

    // Aggiorna la data di ultima modifica ad ogni update
    @PreUpdate
    protected void onUpdate() {
        ZoneId zoneId = ZoneId.of("Europe/Rome");
        dataUltimaModifica = LocalDateTime.now(zoneId);
    }

    // =======================
    // Getters
    // =======================
    public UUID getId() { return id; }
    public String getTitolo() { return titolo; }
    public String getContenuto() { return contenuto; }
    public String getProprietario() { return proprietario; }
    public LocalDateTime getDataCreazione() { return dataCreazione; }
    public LocalDateTime getDataUltimaModifica() { return dataUltimaModifica; }
    public UUID getIdCartella() { return idCartella; }
    public String getTag() { return tag; }

    // =======================
    // Setters
    // =======================
    public void setId(UUID id) { this.id = id; }
    public void setTitolo(String titolo) { this.titolo = titolo; }
    public void setContenuto(String contenuto) { this.contenuto = contenuto; }
    public void setProprietario(String proprietario) { this.proprietario = proprietario; }
    public void setDataCreazione(LocalDateTime dataCreazione) { this.dataCreazione = dataCreazione; }
    public void setDataUltimaModifica(LocalDateTime dataUltimaModifica) { this.dataUltimaModifica = dataUltimaModifica; }
    public void setIdCartella(UUID idCartella) { this.idCartella = idCartella; }
    public void setTag(String tag) { this.tag = tag; }
}
