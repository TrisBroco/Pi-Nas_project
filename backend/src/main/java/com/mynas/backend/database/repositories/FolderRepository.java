package com.mynas.backend.database.repositories;

import com.mynas.backend.database.FolderRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FolderRepository extends JpaRepository<FolderRecord, Long> {
    List<FolderRecord> findByOwnerIdAndFolderPath(long ownerId, String folderPath);
    Optional<FolderRecord> findByOwnerIdAndFolderPathAndName(long ownerId, String folderPath, String name);
    List<FolderRecord> findByOwnerIdAndFolderPathStartingWith(long ownerId, String prefix);
    void deleteByOwnerIdAndFolderPathStartingWith(long ownerId, String prefix);
}