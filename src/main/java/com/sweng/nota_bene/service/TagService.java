package com.sweng.nota_bene.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.sweng.nota_bene.dto.TagResponse;
import com.sweng.nota_bene.model.Tag;
import com.sweng.nota_bene.repository.TagRepository;

@Service
public class TagService {
    
    @Autowired
    private TagRepository tagRepository;
    
    /**
     * Recupera tutti i tag disponibili
     */
    public List<TagResponse> getAllTags() {
        List<Tag> tags = tagRepository.findAllOrderByNome();
        return tags.stream()
                .map(tag -> TagResponse.from(tag.getNome()))
                .collect(Collectors.toList());
    }
    
    /**
     * Trova un tag per nome
     */
    public Tag findByNome(String nome) {
        return tagRepository.findById(nome).orElse(null);
    }
    
    /**
     * Verifica se un tag esiste
     */
    public boolean existsByNome(String nome) {
        return tagRepository.existsById(nome);
    }
    
    /**
     * Crea un nuovo tag se non esiste
     */
    public Tag createTagIfNotExists(String nome) {
        if (nome == null || nome.trim().isEmpty()) {
            return null;
        }
        
        String nomePulito = nome.trim();
        
        if (!tagRepository.existsById(nomePulito)) {
            Tag nuovoTag = new Tag(nomePulito);
            return tagRepository.save(nuovoTag);
        }
        
        return tagRepository.findById(nomePulito).orElse(null);
    }
}