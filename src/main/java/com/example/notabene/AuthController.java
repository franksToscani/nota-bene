package com.example.notabene;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AuthController {
    @GetMapping("/")
    public String redirectToAuth() {
        return "redirect:/auth";
    }

    @GetMapping("/auth")
    public String showAuthPage() {
        return "auth-direct"; // carica templates/auth-direct.html
    }
}
