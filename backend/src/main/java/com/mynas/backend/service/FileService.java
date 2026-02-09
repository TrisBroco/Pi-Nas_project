package com.mynas.backend.service;

import com.mynas.backend.service.data_transfer_objects.FileDetailDTO;
import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Getter
@Service
public class FileService {

    @Value("${nas.root-folder}")
    private String rootFolder;
    private static final Logger log = LoggerFactory.getLogger(FileService.class);

    public Map<String, String> convertIfNeeded(Path uploadedFile,
                                               boolean overwrite,
                                               boolean rename,
                                               String newName
    ) throws IOException {
        String name = uploadedFile.getFileName().toString();
        Path lock = Path.of(rootFolder, "video_convert.lock");
//        Path lock = Path.of("/tmp/video_convert.lock");
        String outputName = name.replace(".mkv", ".mp4");

        Map<String, String> response = new HashMap<>();

        Path outputFile = Paths.get(rootFolder,
                (rename && newName != null) ? newName : outputName);


        if (Files.exists(outputFile) && !overwrite && !rename) {
            response.put("status", "exists");
            response.put("message", "File already exists");
            return response;
        }

        try {
            Files.createFile(lock);

            new ProcessBuilder(
                    "ffmpeg", "-i", uploadedFile.toString(),
                    "-codec", "copy",
                    outputFile.toString()
            ).inheritIO().start().waitFor();

            response.put("status", "started");
            response.put("message", "Conversion started");

        } catch (IOException e) {
            log.error("Error converting the mkv file into an mp4.", e);

            response.put("status", "error");
            response.put("message", e.getMessage());
        } catch (InterruptedException e) {
            //Allows the interrupt flag to be raised again so it's not a silent failure.
            Thread.currentThread().interrupt();
            response.put("status", "error");
            response.put("message", e.getMessage());
        } finally {
            // Remove lock file when finished no matter what happens
            Files.deleteIfExists(lock);
            response.put("status", "complete");
            response.put("message", "Conversion Completed.");
        }
        return response;
    }

    public boolean isConverting() {
        return Files.exists(Path.of(rootFolder, "video_convert.lock"));
    }

    public Path getUserFolder(Long userID){
        return Paths.get(rootFolder).resolve("user_" + userID);
    }

    public Path getSafePath(Path baseDir, String filename) throws SecurityException {
        Path resolvedPath = baseDir.resolve(filename).normalize();
        if (!resolvedPath.startsWith(baseDir)) {
            throw new SecurityException("Invalid file path: " + filename);
        }
        return resolvedPath;
    }

    public List<FileDetailDTO> listFiles() {
        File folder = new File(rootFolder);

        if (!folder.exists() || !folder.isDirectory()) {
            throw new RuntimeException("Root folder does not exist: " + rootFolder);
        }

        // 1. Get all files, filter out directories
        return Arrays.stream(folder.listFiles())
                .filter(File::isFile)
                .map(file -> {
                    // 2. Map the java.io.File object to the DTO
                    return new FileDetailDTO(
                            file.getName(),
                            file.length(), // Get file size in bytes
                            // Get last modified time and convert it to Instant for modern usage
                            Instant.ofEpochMilli(file.lastModified())
                    );
                })
                .collect(Collectors.toList());
    }
}