package com.mynas.backend.database.repositories;

import com.mynas.backend.database.FileRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FileRecordRepository extends JpaRepository<FileRecord, Long> {
    Optional<FileRecord> findByPath(String path);
    Optional<FileRecord> findByOwnerIdAndPath(Long ownerId, String path);
    List<FileRecord> findByOwnerIdAndFolderPathAndIsDeletedFalse(long ownerId, String folderPath);
}