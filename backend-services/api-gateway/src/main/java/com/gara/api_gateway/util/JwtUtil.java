package com.gara.api_gateway.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;

@Component
public class JwtUtil {
    
    @Value("${jwt.secret:0ce53a6f85ce5b46c7f3a2d6b85f488ceee6cf74e56ae3492a989e6e11c0307b}")
    private String secret;

    private SecretKey getSignKey(){
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public void validateToken(final String token){
        Jwts.parser().verifyWith(getSignKey()).build().parseSignedClaims(token);
    }
}
