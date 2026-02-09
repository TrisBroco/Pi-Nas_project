package com.mynas.backend.service.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class SecurityConfig {

    /*
       Inject the JWT filter and your custom user details service.
       This makes your configuration reusable and testable.
    */
    private final JwtCookieFilter jwtCookieFilter;
    private final UserDetailsServiceImpl userDetailsService;

    public SecurityConfig(JwtCookieFilter jwtFilter, UserDetailsServiceImpl userDetailsService) {
        this.jwtCookieFilter = jwtFilter;
        this.userDetailsService = userDetailsService;
    }

    /*
       This is the core Spring Security configuration.

       It defines:
       - which URLs are public
       - which URLs require authentication
       - which authentication provider to use
       - whether sessions are used
       - which filters run before requests
    */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        System.out.println("SecurityConfig - SecurityFilterChain()");
        http
                // Disable CSRF because REST APIs do not use session cookies.
                //consider enabling CSRF protection if we use cookies for
                // state-changing ops.
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                /*
                   Define which paths require authentication.
                   - /auth/login and /public/** are accessible without a token.
                   - everything else requires a valid JWT.
                */
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/me").authenticated()
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/public/**").permitAll()
                        .anyRequest().authenticated()
                )

                /*
                   Force Spring to NOT create sessions.
                   This is critical for JWT usage.

                   STATELESS = every request MUST bring a token.
                */
                .sessionManagement(sess -> sess
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .userDetailsService(userDetailsService)

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, authException) -> {
                            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
                            res.getWriter().write("Unauthorized");
                        })
                        .accessDeniedHandler((req, res, accessDeniedException) -> {
                            res.setStatus(HttpServletResponse.SC_FORBIDDEN); // 403
                            res.getWriter().write("Forbidden");
                        })
                )

                /*
                   Register our JWT filter BEFORE Spring’s default username/password filter.
                   This ensures token-based authentication happens first.
                */
                .addFilterBefore(jwtCookieFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        System.out.println("SecurityConfig - CorsConfigurationSource()");
        CorsConfiguration config = new CorsConfiguration();
        // Allowed origin: change to your frontend origin (e.g. https://nas.example.com or http://localhost:3000 during dev)
        config.setAllowedOrigins(List.of("http://localhost:3000", "https://your-nas-domain.example"));
        config.setAllowCredentials(true); // important so browser will send cookies
        config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /*
       The AuthenticationProvider performs real username/password checks.
       You are using DaoAuthenticationProvider, which uses:
       - your UserDetailsServiceImpl to load user
       - your password encoder to verify password
    */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        System.out.println("SecurityConfig - AuthenticationProvider()");
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();

        provider.setUserDetailsService(userDetailsService);

        // Important: encodes and validates hashed passwords
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /*
       AuthenticationManager is used by AuthController to authenticate login attempts.
       Spring auto-builds it from your AuthenticationProvider.
    */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        System.out.println("SecurityConfig - AuthenticationManager()");
        return config.getAuthenticationManager();
    }

    /*
       DelegatingPasswordEncoder allows password formats like:
       - {bcrypt}...
       - {noop}...
       - {argon2}...
       This is why your sample accounts work.
    */
    @Bean
    public PasswordEncoder passwordEncoder() {
        System.out.println("SecurityConfig - PasswordEncoder()");
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        System.out.println("SecurityConfig - WebMvcConfigurer()");
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET","POST","PUT","DELETE")
                        .allowCredentials(true);
            }
        };
    }

}
