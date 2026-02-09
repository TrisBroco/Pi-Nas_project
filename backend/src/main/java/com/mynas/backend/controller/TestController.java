package com.mynas.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/api/test")
    public String hello() {
        System.out.println("/API/test");
        return "🐻🍯 Hi Baby! My service is running!";
    }
}
