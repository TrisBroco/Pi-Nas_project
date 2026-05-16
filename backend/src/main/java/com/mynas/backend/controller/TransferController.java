package com.mynas.backend.controller;

import com.mynas.backend.database.FileRecord;
import com.mynas.backend.database.User;
import com.mynas.backend.database.repositories.FileRecordRepository;
import com.mynas.backend.database.repositories.UserRepository;
import com.mynas.backend.service.FileService;
import com.mynas.backend.service.MimeTypes;
import com.mynas.backend.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@RestController
@RequestMapping("/api")
public class TransferController {
    private final FileService fileService;
    private final Path storagePath;
    private static final Logger log = LoggerFactory.
            getLogger(FileController.class);
    private final UserRepository userRepository;
    private final FileRecordRepository fileRecordRepository;

    public TransferController(FileService fileService, FileRecordRepository fileRecordRepository,
                              UserRepository userRepository, UserService userService) {
        this.fileService = fileService;
        this.storagePath = Path.of(fileService.getRootFolder());
        this.fileRecordRepository = fileRecordRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadFile(
            @RequestParam("filename") String filename,
            Authentication auth) throws IOException {

        String username = auth.getName();
        Path userStoragePath = storagePath.resolve(username);
        String normalized = filename.replace("\\", "/");
        Path safePath = fileService.getSafePath(userStoragePath, normalized);

        if (!Files.exists(safePath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(safePath.toUri());

        //Fix for mobile devices not knowing what file is being downloaded
        // & defaulting to *.html.
        String contentType = MimeTypes.fromPath(safePath);

        //provides a safe default type if the files type cannot be determined.
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\""
                                + filename + "\"")
                .body(resource);
    }

    @PostMapping("/upload")
    @Transactional
    public ResponseEntity<Map<String, Object>> uploadFiles(
            @RequestParam("file") MultipartFile[] files,
            @RequestParam(value = "folder", required = false) String folder,
            Authentication auth
    ) throws IOException {

        List<Map<String, String>> successList = new ArrayList<>();
        List<Map<String, String>> errorList = new ArrayList<>();

        String safeUser = auth.getName();
        String safeFolder = (folder == null || folder.isBlank()) ? ""
                : sanitizeFolder(folder);

        // Base path: exp: /root/user
        Path userBase = storagePath.resolve(safeUser);

        // Full final target directory as a Path
        Path targetDir = safeFolder.isBlank()
                ? userBase
                : userBase.resolve(safeFolder);



        // Fetch user with DB lock with DBlock to avoid uploads incorrectly updating used_storage
        User userRecord = userRepository.findForUpdate(safeUser)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Fetch user quota & current usage
        long maxStorage = userRecord.getMaxStorage(); // default 300GB
        long currentUsage = userRecord.getUsedStorage();

        // Process Each File
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                errorList.add(Map.of("filename", "unknown", "error", "Empty file"));
                continue;
            }

            // Check quota BEFORE writing the file
            long newUsage = currentUsage + file.getSize();
            if (newUsage > maxStorage) {
                errorList.add(Map.of(
                        "filename", Objects.requireNonNull(file.getOriginalFilename()),
                        "error", "User storage quota exceeded"
                ));
                continue;
            }

            // Extract + normalize filename to prevent traversal
            String originalName = Paths.get(
                    Objects.requireNonNull(file.getOriginalFilename())
            ).getFileName().toString();

            // Sanitize filename
            String safeFileName = sanitizeFilename(originalName);
            String extension = originalName.contains(".")
                    ? originalName.substring(originalName.lastIndexOf(".") + 1)
                    : "";

            // UUID-prefixed flat storage
            String storedName = UUID.randomUUID() + "_" + originalName;
            Path filePath = userBase.resolve(storedName);

            String mimeType = MimeTypes.fromMultipart(file);

            FileRecord record = new FileRecord();

            try {
                String checksum = DigestUtils.md5DigestAsHex(file.getInputStream());

                // Save metadata to DB, will use for later when displaying video info
                record.setExtension(extension);
                record.setMimeType(mimeType);
                record.setOwnerId(userRecord.getId());
                record.setName(safeFileName);
                record.setSize(file.getSize());
                record.setChecksum(checksum);
                record.setPath(filePath.toString());
                record.setFolderPath(safeFolder);
                fileRecordRepository.save(record);

                // Save file
                file.transferTo(filePath);
                currentUsage += file.getSize();

                // Update storage quota
                userRecord.setUsedStorage(currentUsage);
                userRepository.save(userRecord);

                log.info("Uploaded file '{}' to {} for user {}", safeFileName, safeFolder, safeUser);
                successList.add(Map.of(
                        "filename", safeFileName,
                        "path", filePath.toString(),
                        "status", "uploaded"
                ));
            } catch (IOException e) {
                log.error("Failed to upload file on Disk '{}' for user {}: {}", safeFileName, safeUser, e.getMessage());
                fileRecordRepository.delete(record);
                errorList.add(Map.of(
                        "filename", safeFileName,
                        "error", e.getMessage()
                ));
            }
            catch (Exception e) {
                log.error("Failed to upload file on DB '{}' for user {}: {}", safeFileName, safeUser, e.getMessage());
                errorList.add(Map.of(
                        "filename", safeFileName,
                        "error", e.getMessage()
                ));
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", successList);
        response.put("errors", errorList);
        response.put("folder", safeFolder);
        response.put("user", safeUser);

        HttpStatus status = errorList.isEmpty() ? HttpStatus.OK : HttpStatus.PARTIAL_CONTENT;

        return ResponseEntity.status(status).body(response);
    }

    /**
     * Removes dangerous characters and prevents path traversal attempts.
     */
    private String sanitizeFolder(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }

        String trimmed = input.trim();

        if (trimmed.contains("..")) {
            throw new IllegalArgumentException("Invalid folder path");
        }

        // allow letters, numbers, underscore, dash, slash
        return trimmed.replaceAll("[^a-zA-Z0-9_\\-]", "");
    }

    private String sanitizeFilename(String input) {
        String trimmed = input.trim();

        if (trimmed.contains("..") || trimmed.contains("/")
                || trimmed.contains("\\")) {
            throw new IllegalArgumentException("Invalid filename");
        }

        // allow letters, numbers, underscore, dash, and DOTS


        return trimmed.replaceAll("[^a-zA-Z0-9_.\\-]", "");
    }
}
