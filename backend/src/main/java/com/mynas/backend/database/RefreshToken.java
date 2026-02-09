package com.mynas.backend.database;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;

    @Getter
    @Setter
    private String username;

    @Getter
    @Setter
    @Column(length = 2000)
    private String token; // store the token string (optionally store a hash instead)

    @Getter
    @Setter
    private Instant createdAt;

    @Getter
    @Setter
    private Instant expiresAt;

}
