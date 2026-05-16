package com.mynas.backend.service.data_transfer_objects;

import java.time.LocalDateTime;

public record FolderMetadataDTO(
        Long id,
        String name,
        String path,       // full path including this folder: folderPath + "/" + name
        String folderPath, // parent path
        LocalDateTime dateCreated
) {}