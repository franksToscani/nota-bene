package com.example.notabene;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/ping")
    public String home() {
        return "Applicazione Spring Boot funzionante! ✅";
    }
}

