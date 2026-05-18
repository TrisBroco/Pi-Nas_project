package com.mynas.backend.controller;

import com.mynas.backend.service.AppSettings;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AppSettings appSettings;

    public AdminController(AppSettings appSettings) {
        this.appSettings = appSettings;
    }

    // "Anyone" can check if registration is open — used by login page poll
    @GetMapping("/settings")
    public ResponseEntity<?> getSettings() {
        return ResponseEntity.ok(Map.of(
                "registrationOpen", appSettings.isRegistrationOpen()
        ));
    }

    // Only admins can change settings
    @PostMapping("/settings")
    public ResponseEntity<?> updateSettings(
            @RequestBody Map<String, Object> body,
            Authentication auth) {

        // Check admin role
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin only"));
        }

        if (body.containsKey("registrationOpen")) {
            boolean value = Boolean.parseBoolean(body.get("registrationOpen").toString());
            appSettings.setRegistrationOpen(value);
            System.out.println("Registration toggled: " + value + " by " + auth.getName());
        }

        return ResponseEntity.ok(Map.of(
                "registrationOpen", appSettings.isRegistrationOpen()
        ));
    }
}