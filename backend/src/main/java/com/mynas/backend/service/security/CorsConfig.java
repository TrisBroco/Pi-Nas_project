package com.mynas.backend.service.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {

        System.out.println("CORS FILTER()");
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowCredentials(true);
        config.addAllowedOrigin("http://localhost:3000"); // Next.js dev
        config.addAllowedOrigin("http://pi-nas:3000");    // If you run Next.js on the Pi
        config.addAllowedOrigin("http://192.168.1.152:3000");

        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        // IMPORTANT: apply to all endpoints
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
