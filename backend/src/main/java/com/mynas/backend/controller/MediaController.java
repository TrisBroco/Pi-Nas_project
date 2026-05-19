package com.mynas.backend.controller;

import com.mynas.backend.database.FileRecord;
import com.mynas.backend.database.repositories.FileRecordRepository;
import com.mynas.backend.database.repositories.UserRepository;
import com.mynas.backend.service.FileService;
import com.mynas.backend.service.MimeTypes;
import com.mynas.backend.service.UserService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api")
public class MediaController {
    private final FileService fileService;
    private final Path storagePath;
    private final UserService userService;
    private final FileRecordRepository fileRecordRepository;

    public MediaController(FileService fileService,
                           UserRepository userRepository,
                           FileRecordRepository fileRecordRepository) {
        this.fileService = fileService;
        this.storagePath = Path.of(fileService.getRootFolder());
        this.fileRecordRepository = fileRecordRepository;
        userService = new UserService(userRepository);
    }

    @GetMapping("/stream")
    public ResponseEntity<ResourceRegion> streamVideo(
            @RequestParam("filename") String filename,
            @RequestHeader HttpHeaders headers,
            Authentication auth) throws IOException {

        long userId = userService.getUserId(auth.getName());
        Path diskPath = Path.of(resolveFileRecord(userId, filename).getPath());

        if (!Files.exists(diskPath)) {
            return ResponseEntity.notFound().build();
        }

        UrlResource media = new UrlResource(diskPath.toUri());
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

    // Works for any file type. Serves up the file with the correct Content-Type
//    and lets the browser decide.
    @GetMapping("/serve")
    public ResponseEntity<Resource> serveFile(
            @RequestParam("filename") String filename,
            Authentication auth) throws IOException {

        String username = auth.getName();
        long userId = userService.getUserId(username);

        // Look up actual stored path from DB
        FileRecord recordOpt = resolveFileRecord(userId, filename);

        Path diskPath = Path.of(recordOpt.getPath());

        if (!Files.exists(diskPath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(diskPath.toUri());
        String contentType = MimeTypes.fromPath(diskPath);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic())
                .body(resource);
    }

    // Extract the record lookup into a private helper to avoid repeating it
    private FileRecord resolveFileRecord(long userId, String filename) {
        String normalized = filename.replace("\\", "/");
        int lastSlash = normalized.lastIndexOf("/");
        String folderPath = lastSlash == -1 ? "" : normalized.substring(0, lastSlash);
        String name = lastSlash == -1 ? normalized : normalized.substring(lastSlash + 1);

        return fileRecordRepository
                .findByOwnerIdAndFolderPathAndNameAndIsDeletedFalse(userId, folderPath, name)
                .orElseThrow(() -> new NoSuchElementException("File not found: " + filename));
    }

    @GetMapping("/thumbnail")
    public ResponseEntity<Resource> serveThumbnail(
            @RequestParam("id") Long fileId,
            Authentication auth) throws IOException {

        long userId = userService.getUserId(auth.getName());

        Optional<FileRecord> recordOpt = fileRecordRepository.findById(fileId);
        if (recordOpt.isEmpty() || recordOpt.get().getOwnerId() != userId) {
            return ResponseEntity.notFound().build();
        }

        String thumbPath = recordOpt.get().getThumbnailPath();
        if (thumbPath == null) {
            return ResponseEntity.notFound().build();
        }

        Path path = Path.of(thumbPath);
        if (!Files.exists(path)) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS))
                .body(new UrlResource(path.toUri()));
    }

}
