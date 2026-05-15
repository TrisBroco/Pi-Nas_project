package com.mynas.backend.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mynas.backend.database.FileRecord;
import com.mynas.backend.database.User;
import com.mynas.backend.database.repositories.FileRecordRepository;
import com.mynas.backend.database.repositories.UserRepository;
import com.mynas.backend.service.FileService;
import com.mynas.backend.service.UserService;
import com.mynas.backend.service.data_transfer_objects.FileMetadataDTO;
import com.mynas.backend.service.data_transfer_objects.StorageDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.*;
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
import java.util.stream.Collectors;

import static com.mynas.backend.service.IO.println;

@RestController
@RequestMapping("/api")
public class FileController {

    private final FileService fileService;
    private final Path storagePath;
    private static final Logger log = LoggerFactory.
            getLogger(FileController.class);
    private final FileRecordRepository fileRecordRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    UserService userService;

    public FileController(FileService fileService,
                          FileRecordRepository fileRecordRepository,
                          UserRepository userRepository,
                          ObjectMapper objectMapper) {
        this.fileService = fileService;
        this.storagePath = Path.of(fileService.getRootFolder());
        this.fileRecordRepository = fileRecordRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        userService = new UserService(userRepository);
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
                            fr.getId(),
                            fr.getName(),
                            fr.getExtension(),
                            fr.getMimeType(),
                            fr.getOwnerId(),
                            fr.getSize(),
                            fr.getChecksum(),
                            fr.getPath(),
                            fr.getFolderPath(),
                            fr.getDateCreated(),
                            fr.getDateModified(),
                            fr.isDeleted(),
                            fr.getVersion(),
                            getMetadataMap(fr)
                    ))
                    .toList();

            // Extract just immediate children only
            String prefix = folderPath.isEmpty() ? "" : folderPath + "/";

            // Get all folderPaths that start with current path
            List<String> allSubPaths = fileRecordRepository.findDistinctFolderPathsUnder(userId, prefix, folderPath);
            println("/list | allSubPaths raw: " + allSubPaths);

            String finalFolderPath = folderPath;
            List<Map<String, String>> folders = allSubPaths.stream()
                    .filter(p -> p.startsWith(prefix) && !p.equals(finalFolderPath))
                    .map(p -> p.substring(prefix.length()))   // strip the current prefix
                    .map(p -> p.contains("/") ? p.substring(0, p.indexOf("/")) : p) // first segment only
                    .distinct()
                    .filter(name -> !name.isBlank())
                    .map(name -> Map.of(
                            "name", name,
                            "path", prefix + name
                    ))
                    .toList();

            return ResponseEntity.ok(Map.of(
                    "user", username,
                    "folder", folderPath,
                    "files", files,
                    "folders", folders
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "files", List.of(),
                    "error", e.getMessage()));
        }
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


    //    TODO Move to FileTransferController file
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

        try {
            // Validate the full directory path (prevents ../../ attacks)
            targetDir = getSafePath(storagePath, targetDir);

            // Create directory if missing
            Files.createDirectories(targetDir);

        } catch (Exception e) {
            log.error("Failed to create or validate upload directory {}", targetDir, e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Unable to prepare directory.", "details", e.getMessage()));
        }


        // Fetch user quota & current usage

        // Fetch user with DB lock with DBlock to avoid uploads incorrectly updating used_storage
        User userRecord = userRepository.findForUpdate(safeUser)
                .orElseThrow(() -> new RuntimeException("User not found"));
        // Will be handled by GlobalExceptionHandler

        long maxStorage = userRecord.getMaxStorage(); // default 300GB
        long currentUsage = userRecord.getUsedStorage();


        // Process Each File
        for (MultipartFile file : files) {

            if (file == null || file.isEmpty()) {
                errorList.add(Map.of("filename", "unknown", "error", "Empty file"));
                log.warn("Upload rejected: empty file received for user {}", safeUser);
                continue;
            }

            // Check quota BEFORE writing the file
            long newUsage = currentUsage + file.getSize();
            if (newUsage > maxStorage) {

                log.warn("Quota exceeded for user {}: {} used / {} max",
                        safeUser, userRecord.getUsedStorage(), maxStorage);

                errorList.add(Map.of(
                        "filename", Objects.requireNonNull(file.getOriginalFilename()),
                        "error", "User storage quota exceeded"
                ));
                continue; // Skip this file
            }

            // Extract + normalize filename to prevent traversal
            String originalName = Paths.get(
                    Objects.requireNonNull(file.getOriginalFilename())
            ).getFileName().toString();

            // Sanitize filename
            String safeFileName = sanitizeFilename(originalName);

            try {
                // Final file path
                Path destination = targetDir.resolve(safeFileName);

                // Validate again (double-checked safety)
                destination = getSafePath(storagePath, destination);


                String checksum = DigestUtils.md5DigestAsHex(file.getInputStream());

                // Compute relative folder path for DB
                String relativeFolder = userBase.equals(targetDir) ? ""
                        : userBase.relativize(targetDir).toString().replace("\\", "/");
                if (fileRecordRepository.findByPath(targetDir.resolve(safeFileName).toString()).isPresent()) {
                    //todo - loop to index duplicates
                    log.error("Upload rejected: file already exist for user {}", safeUser);
                    throw new Exception("File already exists");
                }

                // Update current usage
                currentUsage += file.getSize();

                String mimeType = file.getContentType();
                if (mimeType == null || mimeType.equals("application/octet-stream")) {
                    mimeType = Files.probeContentType(destination);
                    //Final fallback for mimeType
                    if (mimeType == null) {
                        mimeType = "application/octet-stream";
                    }
                }

                // Save metadata to DB, will use for later when displaying video info
                FileRecord record = new FileRecord();

                record.setExtension(extractExtension(safeFileName));
                record.setMimeType(mimeType);
                record.setOwnerId(userRecord.getId());
                record.setName(safeFileName);
                record.setSize(file.getSize());
                record.setChecksum(checksum);
                record.setPath(targetDir.resolve(safeFileName).toString());
                record.setFolderPath(relativeFolder);
                userRecord.setUsedStorage(userRecord.getUsedStorage() + file.getSize());

                /* TODO - NEEDS FIX | delete DB entry if file throws error
                 *  the opposite shouldn't happen. (ie: delete file if db throws error)
                 * */
                fileRecordRepository.save(record);

                // Save file
                file.transferTo(destination.toFile());

                log.info("Uploaded file '{}' to {} for user {}", safeFileName, destination, safeUser);
                successList.add(Map.of(
                        "filename", safeFileName,
                        "path", destination.toString(),
                        "status", "uploaded"
                ));

            } catch (Exception e) {
                log.error("Failed to upload file '{}' for user {}: {}", safeFileName, safeUser, e.getMessage());
                errorList.add(Map.of(
                        "filename", safeFileName,
                        "error", e.getMessage()
                ));
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", successList);
        response.put("errors", errorList);
        response.put("uploadFolder", targetDir.toAbsolutePath());
        response.put("user", safeUser);

        HttpStatus status = errorList.isEmpty() ? HttpStatus.OK : HttpStatus.PARTIAL_CONTENT;

        return ResponseEntity.status(status).body(response);
    }

    private String extractExtension(String filename) {
        if (filename == null) {
            return "";
        }

        int lastDot = filename.lastIndexOf('.');
        if (lastDot == -1 || lastDot == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastDot + 1).toLowerCase();
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

    // Works for any file type. Serves up the file with the correct Content-Type
//    and lets the browser decide.
    @GetMapping("/serve")
    public ResponseEntity<Resource> serveFile(
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
        String contentType = Files.probeContentType(safePath);
        if (contentType == null) contentType = "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }


    //    TODO Move to FileTransferController file
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
        String contentType = Files.probeContentType(safePath);

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

    @GetMapping("/stream")
    public ResponseEntity<ResourceRegion> streamVideo(
            @RequestParam("filename") String filename,
            @RequestHeader HttpHeaders headers,
            Authentication auth) throws IOException {

        String username = auth.getName();
        Path userStoragePath = storagePath.resolve(username);
        String normalized = filename.replace("\\", "/");
        Path safePath = fileService.getSafePath(userStoragePath, normalized);

        if (!Files.exists(safePath)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        UrlResource media = new UrlResource(safePath.toUri());
        long contentLength = media.contentLength();
        MediaType mediaType = MediaTypeFactory.getMediaType(media)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);

        List<HttpRange> ranges = headers.getRange();

        if (!ranges.isEmpty()) {
            HttpRange range = ranges.get(0);
            ResourceRegion region = range.toResourceRegion(media);
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .contentType(mediaType)
                    .body(region);
        } else {
            ResourceRegion region = new ResourceRegion(media, 0,
                    Math.min(1024 * 1024, contentLength));
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .contentType(mediaType)
                    .body(region);
        }
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
}