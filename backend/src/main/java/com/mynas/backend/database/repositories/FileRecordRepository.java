package com.mynas.backend.database.repositories;

import com.mynas.backend.database.FileRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FileRecordRepository extends JpaRepository<FileRecord, Long> {
    Optional<FileRecord> findByPath(String path);
    Optional<FileRecord> findByOwnerIdAndPath(Long ownerId, String path);
    List<FileRecord> findByOwnerIdAndFolderPathAndIsDeletedFalse(long ownerId, String folderPath);
    @Query("SELECT DISTINCT f.folderPath FROM FileRecord f " +
            "WHERE f.ownerId = :ownerId " +
            "AND f.folderPath LIKE :prefix% " +
            "AND f.isDeleted = false " +
            "AND f.folderPath <> :currentPath")
    List<String> findDistinctFolderPathsUnder(
            @Param("ownerId") long ownerId,
            @Param("prefix") String prefix,
            @Param("currentPath") String currentPath
    );
}