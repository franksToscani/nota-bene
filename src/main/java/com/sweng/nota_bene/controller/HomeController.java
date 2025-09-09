package com.sweng.nota_bene.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String auth() {
        return "auth"; 
    }

    @GetMapping("/home")
    public String home() {
        return "home"; 
    }
}
