package com.sweng.nota_bene;

import org.springframework.web.bind.annotation.GetMapping;

public class HomeController {

    @GetMapping("/")
    public String home() {
        return "Applicazione Spring Boot funzionante! ✅";
    }
}
