package com.mynas.backend.controller;

import com.mynas.backend.database.RefreshToken;
import com.mynas.backend.database.User;
import com.mynas.backend.database.repositories.RefreshTokenRepository;
import com.mynas.backend.database.repositories.UserRepository;
import com.mynas.backend.service.AppSettings;
import com.mynas.backend.service.FileService;
import com.mynas.backend.service.security.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtService jwtService;
    private final RefreshTokenRepository refreshRepo;
    private final AppSettings appSettings;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Path storagePath;

    @Value("${nas.root-folder}")
    private String rootFolder;

    @Value("${app.cookie-secure}")
    private boolean secure;
    @Value("${app.sameSite}")
    private String sameSite;

    public AuthController(AuthenticationManager authManager, JwtService jwtService,
                          RefreshTokenRepository refreshRepo, AppSettings appSettings,
                          UserRepository userRepository, PasswordEncoder passwordEncoder,
                          FileService fileService) {
        this.authManager = authManager;
        this.jwtService = jwtService;
        this.refreshRepo = refreshRepo;
        this.appSettings = appSettings;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.storagePath = Path.of(fileService.getRootFolder());
    }

    // Helper function to extract a cookie value
    private String extractCookieValue(HttpServletRequest request, String name) {
        return Arrays.stream(Optional.ofNullable(request.getCookies()).orElse(new Cookie[0]))
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    // Helper function to create the ResponseCookie
    private ResponseCookie createCookie(String name, String value, String path, long maxAge, boolean isHttpOnly) {
        if(maxAge < 0) {
            maxAge = (60 * 10);
        }
        return ResponseCookie.from(name, value)
                .httpOnly(isHttpOnly)
                .secure(secure)
                .path(path)
                .maxAge(maxAge)
                .sameSite(sameSite)
                .build();
    }
    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(
            @RequestBody Map<String, String> body,
            HttpServletResponse response) {

        System.out.println("/AUTH/REGISTER");

        // Check registration is open
        if (!appSettings.isRegistrationOpen()) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Registration is currently closed"));
        }

        String username = body.get("username");
        String password = body.get("password");

        // Validate input
        if (username == null || username.isBlank() ||
                password == null || password.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Username and password required"));
        }

        if (!username.matches("^[a-zA-Z0-9_]{3,20}$")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Username must be 3-20 alphanumeric characters or underscores"));
        }

        if (password.length() < 8) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Password must be at least 8 characters"));
        }

        // Check username taken
        if (userRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Username already taken"));
        }

        // Create user
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRoles("USER");
        user.setMaxStorage(100L * 1024 * 1024 * 1024); // 100GB default
        user.setUsedStorage(0L);
        userRepository.save(user);

        // Create user directory on disk
        try {
            Path userDir = storagePath.resolve(username);
            Files.createDirectories(userDir);
        } catch (Exception e) {
            // Don't fail registration if dir creation fails — upload will retry
            System.err.println("Could not create user directory: " + e.getMessage());
        }

        System.out.println("/AUTH/REGISTER | created user: " + username);
        return ResponseEntity.ok(Map.of("success", true, "username", username));
    }

    @PostMapping("/login")
    @Transactional // <-- REQUIRED for delete and save operations
    public ResponseEntity<?> login(@RequestBody Map<String,String> body, HttpServletResponse response) {
        String username = body.get("username");
        String password = body.get("password");

        System.out.println("/AUTH/LOGIN");
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );
        }
        catch (AuthenticationException ex) {
            System.out.println("Authentication Exception");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error","Invalid credentials"));
        }

        // Invalidate any existing refresh token for this user (prevent multiple active tokens)
        refreshRepo.deleteByUsername(username);

        String newAccess = jwtService.generateAccessToken(username);
        String newRefresh = jwtService.generateRefreshToken(username);

        // Persist the new refresh token
        RefreshToken rt = new RefreshToken();
        rt.setUsername(username);
        rt.setToken(newRefresh);
        rt.setCreatedAt(Instant.now());
        rt.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
        refreshRepo.save(rt);

        // Create cookies
        ResponseCookie accessCookie = createCookie("access_token", newAccess, "/", -1, true);
        ResponseCookie refreshCookie = createCookie("refresh_token", newRefresh, "/", (60L * 60 * 24 * 7), true);

        // Use addHeader for each cookie
        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        return ResponseEntity.ok(Map.of("status","ok"));
    }



    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails user) {
        System.out.println("/AUTH/ME");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        boolean isAdmin = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        return ResponseEntity.ok(Map.of(
                "username", user.getUsername(),
                "isAdmin", isAdmin
        ));
    }

    /*
        Token Refresh endpoint:
        (FIXED: Added @Transactional)
     */
    @PostMapping("/refresh")
    @Transactional // <-- REQUIRED for delete and save operations
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {
        System.out.println("/AUTH/REFRESH");

        // Use helper to read refresh cookie
        String refreshToken = extractCookieValue(request, "refresh_token");

        if (refreshToken == null || !jwtService.isTokenValid(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error","No or invalid refresh token"));
        }

        // Ensure refresh token exists in DB
        Optional<RefreshToken> found = refreshRepo.findByToken(refreshToken);
        if (found.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error","Token invalid or expired"));
        }


        // Generate NEW access token
        String username = jwtService.extractUsername(refreshToken);
        String newAccess = jwtService.generateAccessToken(username);

        // Set NEW cookies in the response
        ResponseCookie newAccessCookie = createCookie("access_token", newAccess, "/", -1, true);
        // Use addHeader for each cookie
        response.addHeader(HttpHeaders.SET_COOKIE, newAccessCookie.toString());

        return ResponseEntity.ok(Map.of("status","ok"));
    }


    @PostMapping("/logout")
    @Transactional
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        // remove refresh token from DB if present
        String refreshToken = extractCookieValue(request, "refresh_token");
        if (refreshToken != null) {
            refreshRepo.deleteByToken(refreshToken);
        }
        System.out.println("/AUTH/LOGOUT");
        // Clear cookies (set its maxAge to 0 to make it "expired")
        ResponseCookie clearAccess = createCookie("access_token", "", "/", 0, true);
        ResponseCookie clearRefresh = createCookie("refresh_token", "", "/", 0, true);

        // Use addHeader for each cookie
        response.addHeader(HttpHeaders.SET_COOKIE, clearAccess.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, clearRefresh.toString());

        return ResponseEntity.ok(Map.of("status","logged-out"));
    }
}