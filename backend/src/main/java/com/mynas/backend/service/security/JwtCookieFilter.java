package com.mynas.backend.service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Optional;

@Component
public class JwtCookieFilter extends OncePerRequestFilter {

    /*
       This filter runs BEFORE the request hits your controllers.

       Purpose:
       --------
       - Intercept every request
       - Look for a JWT in the Authorization header
       - Validate the JWT
       - Extract the username from the JWT
       - Load the user from your UserDetailsService
       - Tell Spring Security: “User is authenticated for this request”
    */
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtCookieFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        System.out.println("JwtCookieFilter - doFilterInternal()");

        String accessToken = Arrays.stream(Optional.ofNullable(request.getCookies()).orElse(new Cookie[0]))
                .filter(c -> "access_token".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);


        /*
            Only continue if:
            - token successfully provided a username
            - AND the user is NOT already authenticated

            (Spring Security prevents re-authentication inside the same request.)
        */
        if (accessToken != null && jwtService.isTokenValid(accessToken)
                && SecurityContextHolder.getContext().getAuthentication() == null){
            // Extract the username stored inside the JWT's "sub" claim.
            // jwtService ALSO validates the signature here.
            String username = jwtService.extractUsername(accessToken);

            /*
               Ask your UserDetailsService to load the user from storage.

               This does NOT check passwords — passwords are only checked at LOGIN.
               JWT request authentication *never* checks password again.
            */
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            /*
               Build an authentication object that represents:
               - The authenticated user
               - Their roles/authorities
               - No password needed because JWT already “proved” identity
            */
            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

            /*
               Attach additional details such as:
               - IP address
               - sessionId
               - user agent
               This is optional but standard Spring behavior.
            */
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            /*
               NOW THE IMPORTANT PART:

               This puts the Authentication object into Spring Security’s
               SecurityContextHolder. This is how Spring knows:
               “Yes, this user is authenticated for this request.”
            */
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        // Continue the filter chain. Once authenticated here,
        // controllers protected with @PreAuthorize / security rules can be accessed.
        chain.doFilter(request, response);
    }
}
