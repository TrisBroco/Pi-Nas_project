package com.mynas.backend.service.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    // ✅ JwtService.java
    @Value("${app.jwt-secret}")
    private String secret;

    private SecretKey key;

    // Convert the raw string secret into a SecretKey object usable by JJWT.
    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
    }





    /*
       Create a JWT token containing:
       - the username (in the "sub" field)
       - issued at time
       - expiration time
       - signed with HS256 algorithm

       Returning this token to the user means:
       “This user is now authenticated. They can use this token to access endpoints.”
    */
    public String generateAccessToken(String username) {
        System.out.println("JwtService - generateAccessToken()");
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(username)      // Store username in token (as "sub")
                .issuedAt(new Date(now))   // Token creation timestamp
                .claims(Map.of("type", "access"))
                .expiration(new Date(now + 1000L * 60 * 10))    // Token valid for 10 minutes
                .signWith(key)  // Sign with secret key (HS256)
                .compact(); // Convert to compact JWT string
    }

    // refresh token (longer lifetime e.g. 7 days)
    public String generateRefreshToken(String username) {
        System.out.println("JwtService - generateRefreshToken()");
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(username)
                .claims(Map.of("type", "refresh"))
                .issuedAt(new Date(now))
                .expiration(new Date(now + 1000L * 60 * 60 * 24 * 7)) // 7 days
                .signWith(key)
                .compact();
    }

    /*
       Parse the JWT and return the username (subject).

       Important:
       - This method also VALIDATES the JWT's signature.
         If the token is tampered with, expired, or invalid → exception thrown.
    */
    public String extractUsername(String token) {
        System.out.println("JwtService - extractUsername()");
        return Jwts.parser()
                .verifyWith(key)             // Tell parser to check signature using our key
                .build()
                .parseSignedClaims(token)    // Parse + verify signature
                .getPayload()
                .getSubject();               // Return stored username
    }

    public boolean isTokenValid(String token) {
        try {
            System.out.println("JwtService - isTokenValid() - true");
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            System.out.println("JwtService - isTokenValid() - false");
            return false;
        }
    }

}
