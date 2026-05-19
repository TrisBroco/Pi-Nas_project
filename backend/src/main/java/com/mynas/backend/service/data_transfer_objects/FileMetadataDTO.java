package com.mynas.backend.service.data_transfer_objects;

import java.time.LocalDateTime;
import java.util.Map;

public record FileMetadataDTO(
        Long id,
        String name,
        String extension,
        String mimeType,
        long owner_id,
        Long size,
        String checksum,
        String path,
        String folderPath,
        LocalDateTime dateCreated,
        LocalDateTime dateModified,
        boolean deleted,
        int version,
        String thumbnailPath,
        Map<String, Object> extra
) {
}
