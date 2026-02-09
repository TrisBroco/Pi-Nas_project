package com.mynas.backend.service.data_transfer_objects;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * Data Transfer Object for conveying file details to the client.
 */
@Setter
@Getter
public class FileDetailDTO {
    // Setters (Optional, but often included for serialization frameworks)
    // Getters
    private String name;
    private long size; // Size in bytes
    private Instant lastModified;

    public FileDetailDTO(String name, long size, Instant lastModified) {
        this.name = name;
        this.size = size;
        this.lastModified = lastModified;
    }
}