package com.sweng.nota_bene.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "tag")
public class Tag {
    
    @Id
    @Column(name = "nome", nullable = false)
    private String nome;
    
    public Tag() {}
    
    public Tag(String nome) {
        this.nome = nome;
    }
    
    public String getNome() {
        return nome;
    }
    
    public void setNome(String nome) {
        this.nome = nome;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Tag tag = (Tag) o;
        return nome != null ? nome.equals(tag.nome) : tag.nome == null;
    }
    
    @Override
    public int hashCode() {
        return nome != null ? nome.hashCode() : 0;
    }
    
    @Override
    public String toString() {
        return "Tag{" +
                "nome='" + nome + '\'' +
                '}';
    }
}