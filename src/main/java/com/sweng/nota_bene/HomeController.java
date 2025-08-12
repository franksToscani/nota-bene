package com.sweng.nota_bene;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "auth"; // carica templates/auth.html
    }
}
