package com.mynas.backend.database.repositories;

import com.mynas.backend.database.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    List<RefreshToken>  findByUsername(String username);
    void deleteByToken(String token);
    void deleteByUsername(String username);
}
