package com.mynas.backend;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class NasBackendApplication {
    @Autowired
    Environment env;

    public static void main(String[] args) {
        SpringApplication.run(NasBackendApplication.class, args);

//        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
//        System.out.println(encoder.encode("admin"));      // admin password
//        System.out.println(encoder.encode("user123"));    // user password
    }

    @PostConstruct
    public void printActiveProfiles() {
        System.out.println("=== ACTIVE PROFILES ===");
        System.out.println(String.join(", ", env.getActiveProfiles()));
        System.out.println("=======================");
    }


}
