package com.sweng.nota_bene.controller;

import com.sweng.nota_bene.dto.TagResponse;
import com.sweng.nota_bene.service.TagService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

@Controller
public class FormController {
    
    @Autowired
    private TagService tagService;
    
    /**
     * Serve la pagina del form
     */
    @GetMapping("/form")
    public String formPage() {
        return "form"; // Restituisce form.html dalla cartella templates
    }
    
    /**
     * API per recuperare tutti i tag disponibili
     */
    @GetMapping("/api/tag")
    @ResponseBody
    public ResponseEntity<List<TagResponse>> getAllTags() {
        try {
            List<TagResponse> tags = tagService.getAllTags();
            return ResponseEntity.ok(tags);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}