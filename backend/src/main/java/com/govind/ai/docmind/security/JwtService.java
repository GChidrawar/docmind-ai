package com.govind.ai.docmind.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * @author govind.chidrawar
 * @since 30-09-2026
 */
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long expiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    private static final String TOKEN_TYPE_CLAIM = "type";
    private static final String ACCESS_TOKEN = "access";
    private static final String REFRESH_TOKEN = "refresh";

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(UserDetails userDetails) {
        return buildToken(userDetails, ACCESS_TOKEN, expiration);
    }

    public String generateRefreshToken(UserDetails userDetails) {
        return buildToken(userDetails, REFRESH_TOKEN, refreshExpiration);
    }

    private String buildToken(UserDetails userDetails, String tokenType, long lifetimeMs) {
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim(TOKEN_TYPE_CLAIM, tokenType)
                .issuedAt(new Date()).issuer("DocMindAI")
                .expiration(new Date(System.currentTimeMillis() + lifetimeMs))
                .signWith(getSigningKey())
                .compact();
    }

    public Claims getPayload(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

    }

    public String extractUsername(String token) {
        return this.getPayload(token).getSubject();

    }

    public boolean isTokenExpired(String token) {
        return this.getPayload(token).getExpiration().before(new Date());
    }

    public String getIssuer(String token) {
        return this.getPayload(token).getIssuer();
    }

    // Only access tokens authenticate requests; a refresh token must never be accepted here
    public boolean isTokenValid(String token, UserDetails userDetails) {
        return isValidTokenOfType(token, userDetails, ACCESS_TOKEN);
    }

    public boolean isRefreshTokenValid(String token, UserDetails userDetails) {
        return isValidTokenOfType(token, userDetails, REFRESH_TOKEN);
    }

    private boolean isValidTokenOfType(String token, UserDetails userDetails, String expectedType) {
        Claims claims = getPayload(token);
        return expectedType.equals(claims.get(TOKEN_TYPE_CLAIM, String.class))
                && claims.getSubject().equals(userDetails.getUsername())
                && !claims.getExpiration().before(new Date());
    }
}
