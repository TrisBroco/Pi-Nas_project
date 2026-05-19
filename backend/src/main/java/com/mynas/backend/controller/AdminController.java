package com.mynas.backend.controller;

import com.mynas.backend.database.FileRecord;
import com.mynas.backend.database.User;
import com.mynas.backend.database.repositories.FileRecordRepository;
import com.mynas.backend.database.repositories.UserRepository;
import com.mynas.backend.service.AppSettings;
import com.mynas.backend.service.ThumbnailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AppSettings appSettings;
    private final FileRecordRepository fileRecordRepository;
    private final UserRepository userRepository;
    private final ThumbnailService thumbnailService;
    private static final Logger log = LoggerFactory.
            getLogger(AdminController.class);

    public AdminController(AppSettings appSettings, FileRecordRepository fileRecordRepository,
                           UserRepository userRepository,
                           ThumbnailService thumbnailService) {
        this.appSettings = appSettings;
        this.fileRecordRepository = fileRecordRepository;
        this.userRepository = userRepository;
        this.thumbnailService = thumbnailService;
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

    //One time use Generate. Many videos were uploaded but none had thumbnails attached.
    @PostMapping("/thumbnails/generate")
    public ResponseEntity<?> generateAllThumbnails(Authentication auth) {
        log.info("thumbnails/generate | Generating all thumbnails");
        // Admin only
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin only"));
        }

        // Run async so the request returns immediately
        CompletableFuture.runAsync(() -> {
            List<FileRecord> all = fileRecordRepository.findAll();
            int generated = 0;
            int skipped = 0;

            log.info("thumbnails/generate | Total files found: " + all.size());

            for (FileRecord record : all) {
                // Skip if already has thumbnail or not image/video
                if (record.getThumbnailPath() != null) {
                    skipped++;
                    continue;
                }
                if (record.getMimeType() == null) {
                    skipped++;
                    continue;
                }
                // TODO | Put this back after fixing service
                if (/*!record.getMimeType().startsWith("image/") &&*/
                        !record.getMimeType().startsWith("video/")) {
                    skipped++;
                    continue;
                }


                Path filePath = Path.of(record.getPath());
                if (!Files.exists(filePath)) {
                    skipped++;
                    continue;
                }
                log.info("For Loop | File type: " + record.getMimeType());

                // Get username from user repository
                Optional<User> repo = userRepository.findById(record.getOwnerId());

                repo.ifPresent(user -> {

                    String thumbPath = thumbnailService.generateThumbnail(
                            filePath, record.getMimeType(), user.getUsername());
                    System.out.println("For Loop | Thumbnail path: " + thumbPath);
                    if (thumbPath != null) {
                        record.setThumbnailPath(thumbPath);
                        fileRecordRepository.save(record);
                    }
                });
                generated++;
                log.info("For Loop | generated: " + generated);
            }

            log.info("Thumbnail backfill complete: {} generated, {} skipped", generated, skipped);
        });

        return ResponseEntity.ok(Map.of("status", "Thumbnail generation started in background"));
    }
}