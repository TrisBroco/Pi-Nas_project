package com.mynas.backend.controller;

import com.mynas.backend.service.FileService;
import com.mynas.backend.service.MimeTypes;
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

@RestController
@RequestMapping("/api")
public class MediaController {
    private final FileService fileService;
    private final Path storagePath;

    public MediaController(FileService fileService) {
        this.fileService = fileService;
        this.storagePath = Path.of(fileService.getRootFolder());
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
        String contentType = MimeTypes.fromPath(safePath);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

}
