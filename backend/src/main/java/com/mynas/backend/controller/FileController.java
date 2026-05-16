package com.mynas.backend.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mynas.backend.database.FileRecord;
import com.mynas.backend.database.FolderRecord;
import com.mynas.backend.database.User;
import com.mynas.backend.database.repositories.FileRecordRepository;
import com.mynas.backend.database.repositories.FolderRepository;
import com.mynas.backend.database.repositories.UserRepository;
import com.mynas.backend.service.FileService;
import com.mynas.backend.service.UserService;
import com.mynas.backend.service.data_transfer_objects.FileMetadataDTO;
import com.mynas.backend.service.data_transfer_objects.FolderMetadataDTO;
import com.mynas.backend.service.data_transfer_objects.StorageDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.mynas.backend.service.IO.println;

@RestController
@RequestMapping("/api")
public class FileController {

    private final FileService fileService;
    private final Path storagePath;
    private static final Logger log = LoggerFactory.
            getLogger(FileController.class);
    private final UserRepository userRepository;
    private final FileRecordRepository fileRecordRepository;
    private final FolderRepository folderRepository;
    private final ObjectMapper objectMapper;
    UserService userService;

    public FileController(FileService fileService,
                          FileRecordRepository fileRecordRepository,
                          UserRepository userRepository,
                          ObjectMapper objectMapper,
                          FolderRepository folderRepository) {
        this.fileService = fileService;
        this.storagePath = Path.of(fileService.getRootFolder());
        this.fileRecordRepository = fileRecordRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        userService = new UserService(userRepository);
        this.folderRepository = folderRepository;
    }

    @GetMapping("/list")
    public ResponseEntity<?> listFiles(
            @RequestParam(required = false) String folderPath,
            Authentication auth,
            @RequestHeader(value = "Cookie", required = false) String rawCookie
    ) {

        println("Cookie Received: " + rawCookie);
        println("/list | folderPath received: '" + folderPath + "'");

        try {
            println("/list | in try statement");
            // Extract username from JWT-authenticated session
            String username = auth.getName();
            println("Username : " + username);


            long userId = userService.getUserId(username);
            if (userId == -1L) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            println("UserID : " + userId);

            if (folderPath == null) {
                folderPath = "";
                println("Folder Path : " + folderPath);
            }
            println("/list | folderPath bytes: " + Arrays.toString(folderPath.getBytes()));

            // Fetch DB file records
            List<FileRecord> records =
                    fileRecordRepository.findByOwnerIdAndFolderPathAndIsDeletedFalse(
                            userId,
                            folderPath
                    );
            println("records : " + records);

            //Convert DB entities → DTOs
            List<FileMetadataDTO> files = records.stream()
                    .map(fr -> new FileMetadataDTO(
                            fr.getId(), fr.getName(),
                            fr.getExtension(), fr.getMimeType(),
                            fr.getOwnerId(), fr.getSize(),
                            fr.getChecksum(), fr.getPath(),
                            fr.getFolderPath(), fr.getDateCreated(),
                            fr.getDateModified(), fr.isDeleted(),
                            fr.getVersion(), getMetadataMap(fr)
                    ))
                    .toList();

            // Folders from the folders table — simple and explicit
            List<FolderRecord> folderRecords = folderRepository
                    .findByOwnerIdAndFolderPath(userId, folderPath);

            String finalFolderPath = folderPath;
            List<FolderMetadataDTO> folders = folderRecords.stream()
                    .map(f -> new FolderMetadataDTO(
                            f.getId(),
                            f.getName(),
                            finalFolderPath.isBlank() ? f.getName() : finalFolderPath + "/" + f.getName(),
                            f.getFolderPath(),
                            f.getDateCreated()
                    )).toList();

            return ResponseEntity.ok(Map.of(
                    "user", username,
                    "folder", folderPath,
                    "files", files,
                    "folders", folders
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "files", List.of(),
                    "folders", List.of(),
                    "error", e.getMessage()));
        }
    }

    @PostMapping("/folder/create")
    @Transactional
    public ResponseEntity<?> createFolder(
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        try {
            String username = auth.getName();
            long userId = userService.getUserId(username);

            String folderName = (String) body.get("folderName");
            String currentPath = (String) body.getOrDefault("currentPath", "");

            if (folderName == null || folderName.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Folder name required"));
            }

            // Sanitize — allow letters, numbers, spaces, hyphens, underscores
            String safeName = folderName.trim().replaceAll("[^a-zA-Z0-9 _\\-]", "").trim();
            if (safeName.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid folder name"));
            }

            // Check for duplicate in DB
            if (folderRepository.findByOwnerIdAndFolderPathAndName(userId, currentPath, safeName).isPresent()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "A folder with that name already exists here"));
            }

            // Save to DB
            FolderRecord folder = new FolderRecord();
            folder.setName(safeName);
            folder.setFolderPath(currentPath);
            folder.setOwnerId(userId);
            folderRepository.save(folder);

            String fullPath = currentPath.isBlank() ? safeName : currentPath + "/" + safeName;

            println("/folder/create | created: " + fullPath);

            return ResponseEntity.ok(Map.of(
                    "status", "created",
                    "name", safeName,
                    "path", fullPath
            ));

        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/storage")
    public ResponseEntity<StorageDTO> getStorage(
            Authentication auth,
            @RequestHeader(value = "Cookie", required = false) String rawCookie) {

        String username = auth.getName();
        println("Username : " + username);

        // Fetch DB file records
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        //Convert DB entities its DTOs
        StorageDTO storage = new StorageDTO(user.getUsedStorage(), user.getMaxStorage());

        return ResponseEntity.ok(storage);
    }


    private Map<String, Object> getMetadataMap(FileRecord fr) {
        Map<String, Object> metadataMap = null;
        try {
            if (fr.getMetadataJson() != null) {
                metadataMap = objectMapper.readValue(
                        fr.getMetadataJson(),
                        new TypeReference<>() {
                        }
                );
            }
        } catch (Exception e) {
            log.error("Failed to parse metadata JSON for file {}", fr.getId(), e);
        }
        return metadataMap;
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


    private Path getSafePath(Path baseDir, Path finalPath) {
        Path normalized = finalPath.normalize().toAbsolutePath();
        Path safeBase = baseDir.normalize().toAbsolutePath();

        if (!normalized.startsWith(safeBase)) {
            throw new SecurityException("Blocked path traversal attempt: "
                    + finalPath);
        }
        return normalized;
    }

    @DeleteMapping("/delete")
    @Transactional
    public ResponseEntity<?> deleteFile(
            @RequestBody Map<String, Object> body,
            Authentication auth) {

        try {
            String username = auth.getName();
            long userId = userService.getUserId(username);

            if (userId == -1L) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            String filename = (String) body.get("filename");
            String folderPath = (String) body.getOrDefault("folderPath", "");

            if (filename == null || filename.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Filename required"));
            }

            // Relative path for DB look up
            String relativePath = folderPath.isBlank()
                    ? filename
                    : folderPath + "/" + filename;

            // Absolute path to check on disk
            Path userStoragePath = storagePath.resolve(username);
            String normalized = relativePath.replace("\\", "/");
            Path diskPath = fileService.getSafePath(userStoragePath, normalized);

            // Record look up in DB
            Optional<FileRecord> recordOpt = fileRecordRepository
                    .findByOwnerIdAndPath(userId, diskPath.toString().replace("/", "\\"));

            if (recordOpt.isEmpty()) {
                // Try with forward slashes too (linux?)
                recordOpt = fileRecordRepository
                        .findByOwnerIdAndPath(userId, diskPath.toString());
            }

            if (recordOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "File not found in database"));
            }

            FileRecord record = recordOpt.get();

            // Soft delete — mark as deleted in DB for trash feature
            record.setDeleted(true);
            fileRecordRepository.save(record);
            println("/delete | soft deleted: " + record.getName());

            /* TODO Change to implement Hard delete from TRASH instead
            // Hard delete — remove from DB entirely
            fileRecordRepository.delete(record);
            println("/delete | removed from DB: " + record.getName());

            // Delete from disk
            if (Files.exists(diskPath)) {
                Files.delete(diskPath);
                println("/delete | deleted from disk: " + diskPath);
            } else {
                println("/delete | file not found on disk (already gone?): " + diskPath);
            }

            // Update user storage usage TODO Still counts as data until hard delete
            Optional<User> userOpt = userRepository.findForUpdate(username);
            userOpt.ifPresent(user -> {
                long newUsed = Math.max(0, user.getUsedStorage() - record.getSize());
                user.setUsedStorage(newUsed);
                userRepository.save(user);
            });*/

            return ResponseEntity.ok(Map.of(
                    "status", "deleted",
                    "file", record.getName()
            ));

        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        } catch (Exception e) {
            println("/delete | error: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }


    private Path resolveSafePath(Path storageRoot, String user,
                                 List<String> folders, String filename) {
        Path path = storageRoot.resolve(sanitizeFolder(user));

        if (folders != null) {
            for (String folder : folders) {
                path = path.resolve(sanitizeFolder(folder));
            }
        }

        path = path.resolve(sanitizeFilename(filename));

        Path normalized = path.toAbsolutePath().normalize();
        Path rootAbs = storageRoot.toAbsolutePath().normalize();

        if (!normalized.startsWith(rootAbs)) {
            throw new SecurityException("Blocked path traversal attempt");
        }

        return normalized;
    }

    @GetMapping("/metadata")
    public ResponseEntity<?> getFileMetadata(
            @RequestParam String user,
            @RequestParam(required = false) List<String> folders,
            @RequestParam String filename
    ) {
        try {
            String safeUser = sanitizeFolder(user);

            String safeFolder = (folders == null || folders.isEmpty())
                    ? safeUser
                    : safeUser + "/" + folders.stream()
                    .map(this::sanitizeFolder)
                    .collect(Collectors.joining("/"));

            String safeFilename = sanitizeFilename(filename);

            // Compute DB path
            String dbPath = safeFolder + "/" + safeFilename;

            Optional<FileRecord> opt = fileRecordRepository.findByPath(dbPath);

            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "File metadata not found"));
            }

            FileRecord file = opt.get();

            FileMetadataDTO dto = new FileMetadataDTO(
                    file.getId(),
                    file.getName(),
                    file.getExtension(),
                    file.getMimeType(),
                    file.getOwnerId(),
                    file.getSize(),
                    file.getChecksum(),
                    file.getPath(),
                    file.getFolderPath(),
                    file.getDateCreated(),
                    file.getDateModified(),
                    file.isDeleted(),
                    file.getVersion(),
                    getMetadataMap(file)
            );

            return ResponseEntity.ok(dto);

        } catch (Exception e) {

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/trash")
    public ResponseEntity<?> getTrash(Authentication auth) {
        try {
            String username = auth.getName();
            long userId = userService.getUserId(username);
            if (userId == -1L) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }

            List<FileRecord> deleted = fileRecordRepository.findByOwnerIdAndIsDeletedTrue(userId);

            List<FileMetadataDTO> trashFiles = deleted.stream()
                    .map(fr -> new FileMetadataDTO(
                            fr.getId(), fr.getName(), fr.getExtension(), fr.getMimeType(),
                            fr.getOwnerId(), fr.getSize(), fr.getChecksum(), fr.getPath(),
                            fr.getFolderPath(), fr.getDateCreated(), fr.getDateModified(),
                            fr.isDeleted(), fr.getVersion(), getMetadataMap(fr)
                    )).toList();

            return ResponseEntity.ok(Map.of("files", trashFiles));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/restore")
    @Transactional
    public ResponseEntity<?> restoreFile(@RequestBody Map<String, Object> body, Authentication auth) {
        try {
            String username = auth.getName();
            long userId = userService.getUserId(username);
            Long fileId = Long.valueOf(body.get("id").toString());

            Optional<FileRecord> recordOpt = fileRecordRepository.findById(fileId);
            if (recordOpt.isEmpty() || recordOpt.get().getOwnerId() != userId) {
                return ResponseEntity.status(404).body(Map.of("error", "File not found"));
            }

            FileRecord record = recordOpt.get();
            record.setDeleted(false);
            fileRecordRepository.save(record);

            return ResponseEntity.ok(Map.of("status", "restored", "file", record.getName()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/delete/permanent")
    @Transactional
    public ResponseEntity<?> permanentDelete(@RequestBody Map<String, Object> body, Authentication auth) {
        try {
            String username = auth.getName();
            long userId = userService.getUserId(username);
            Long fileId = Long.valueOf(body.get("id").toString());

            Optional<FileRecord> recordOpt = fileRecordRepository.findById(fileId);
            if (recordOpt.isEmpty() || recordOpt.get().getOwnerId() != userId) {
                return ResponseEntity.status(404).body(Map.of("error", "File not found"));
            }

            FileRecord record = recordOpt.get();

            // Delete from disk
            Path diskPath = Path.of(record.getPath());
            if (Files.exists(diskPath)) Files.delete(diskPath);

            // Remove from DB
            fileRecordRepository.delete(record);

            // Update storage
            userRepository.findForUpdate(username).ifPresent(user -> {
                user.setUsedStorage(Math.max(0, user.getUsedStorage() - record.getSize()));
                userRepository.save(user);
            });

            return ResponseEntity.ok(Map.of("status", "permanently deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}