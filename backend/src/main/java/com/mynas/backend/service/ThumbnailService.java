package com.mynas.backend.service;

import net.coobird.thumbnailator.Thumbnails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class ThumbnailService {

    private static final Logger log = LoggerFactory.getLogger(ThumbnailService.class);
    private static final int THUMB_SIZE = 300;

    @Value("${nas.root-folder}")
    private String rootFolder;

    // Returns the thumbnail path, or null if generation failed
    public String generateImageThumbnail(Path sourcePath, String username) {
        try {
            Path thumbDir = Paths.get(rootFolder).resolve(username).resolve(".thumbnails");
            Files.createDirectories(thumbDir);

            String thumbName = UUID.randomUUID() + "_thumb.jpg";
            Path thumbPath = thumbDir.resolve(thumbName);

            log.warn("ThumbnailService | BEFORE Thumbnails.of(), Path: {}", sourcePath);

            Thumbnails.of(sourcePath.toFile())
                    .size(THUMB_SIZE, THUMB_SIZE)
                    .outputFormat("jpg")
                    .toFile(thumbPath.toFile());

            log.warn("ThumbnailService | AFTER Thumbnails.of()");

            log.info("ThumbnailService | Generated image thumbnail: {}", thumbPath);
            return thumbPath.toString();

        } catch (Throwable t) { // <-- CHANGED FROM IOException TO Throwable
            log.error("ThumbnailService | CRITICAL CRASH during image thumbnail generation!", t);
            return null;
        }
    }

    // Video thumbnail via ffmpeg — extracts frame at 1 second
    public String generateVideoThumbnail(Path sourcePath, String username) {
        log.info("ThumbnailService |  Generating video thumbnail for {}: {}", sourcePath, username);
        try {
            Path thumbDir = Paths.get(rootFolder).resolve(username).resolve(".thumbnails");
            Files.createDirectories(thumbDir);

            String thumbName = UUID.randomUUID() + "_thumb.jpg";
            Path thumbPath = thumbDir.resolve(thumbName);

            ProcessBuilder pb = new ProcessBuilder(
                    "ffmpeg",
                    "-i", sourcePath.toString(),
                    "-ss", "00:00:01",       // seek to 1 second
                    "-vframes", "1",          // extract 1 frame
                    "-vf", "scale=300:-1",    // scale width to 300, keep aspect ratio
                    "-y",                     // overwrite if exists
                    thumbPath.toString()
            );
//            pb.redirectErrorStream(true);
            pb.redirectOutput(ProcessBuilder.Redirect.DISCARD);
            pb.redirectError(ProcessBuilder.Redirect.DISCARD);
            log.warn("ThumbnailService |  Before pb.start(), ThumbName: {}, Path: {}", thumbName, thumbPath);
            Process process = pb.start();
            log.warn("ThumbnailService |  AFTER pb.start(), process: {}", process.info());
            int exitCode = process.waitFor();
            log.warn("ThumbnailService |  AFTER process.waitFor(), exitCode: {}", exitCode);

            if (exitCode == 0 && Files.exists(thumbPath)) {
                log.info("ThumbnailService |  Generated video thumbnail: {}", thumbPath);
                return thumbPath.toString();
            } else {
                log.warn("ThumbnailService |  ffmpeg exited with code {} for {}", exitCode, sourcePath);
                return null;
            }

        } catch (Exception e) {
            log.error("ThumbnailService |  Failed to generate video thumbnail for {}: {}", sourcePath, e.getMessage());
            return null;
        }
    }

    // Decides which method to use based on mimeType
    public String generateThumbnail(Path sourcePath, String mimeType, String username) {
        if (mimeType == null) return null;

        if (mimeType.startsWith("image/")) {
            return generateImageThumbnail(sourcePath, username);
        } else if (mimeType.startsWith("video/")) {
            return generateVideoThumbnail(sourcePath, username);
        }

        return null; // no thumbnail for other types
    }
}