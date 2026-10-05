package com.govind.ai.docmind.config;

import com.govind.ai.docmind.repository.UserRepository;
import com.govind.ai.docmind.security.CustomUserDetail;
import com.govind.ai.docmind.security.CustomUserDetailService;
import com.govind.ai.docmind.security.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * @author govind.chidrawar
 * @since 30-09-2026
 */
@RequiredArgsConstructor
@Slf4j
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    private final CustomUserDetailService userDetailService;

    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, @NonNull HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        String username;
        try {
            username = jwtService.extractUsername(token);
            if(username==null ||  username.isEmpty() || !jwtService.isTokenValid(token, userDetailService.loadUserByUsername(username))){
                filterChain.doFilter(request, response);
                return;
            }

            var user = userRepository.findByUserName(username).orElseThrow(() -> new RuntimeException("User not found"));
            var authentication = new UsernamePasswordAuthenticationToken(user, null, new CustomUserDetail(user).getAuthorities());

            authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (Exception e) {
            log.warn("JWT authentication failed for {}: {}", request.getRequestURI(), e.getMessage());
            filterChain.doFilter(request, response);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
