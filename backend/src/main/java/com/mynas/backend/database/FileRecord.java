package com.mynas.backend.database;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "files")
public class FileRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;

    @Setter
    @Getter
    @Column(nullable = false)
    private String extension;

    @Setter
    @Getter
    @Column(name="mime_type", nullable = false)
    private String mimeType;

    @Setter
    @Getter
    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Setter
    @Getter
    @Column(nullable = false)
    private String name;

    @Getter
    @Setter
    @Column(nullable = false, updatable = false)
    private long size;

    @Setter
    @Getter
    @Column(nullable = false)
    private String checksum;

    @Setter
    @Getter
    @Column(nullable = false, unique = true)
    private String path;

    @Setter
    @Getter
    @Column(name = "folder_path", nullable = false)
    private String folderPath;


    @Getter
    @Column(name = "date_created", nullable = false, updatable = false)
    private LocalDateTime dateCreated;

    @Setter
    @Getter
    @Column(name = "date_modified", nullable = false)
    private LocalDateTime dateModified;

    @Setter
    @Getter
    @Column(name = "is_deleted")
    private boolean isDeleted;

    @Setter
    @Getter
    private Integer version;

    @Setter
    @Getter
    @Column(columnDefinition = "json")
    private String metadataJson;

    @Setter
    @Getter
    @Column(name = "thumbnail_path")
    private String thumbnailPath;

    @PrePersist
    protected void onCreate() {
        this.dateCreated = LocalDateTime.now();
        this.dateModified = LocalDateTime.now();
        if (this.version == null) this.version = 1;
    }

    @PreUpdate
    protected void onUpdate() {
        this.dateModified = LocalDateTime.now();
    }
}


