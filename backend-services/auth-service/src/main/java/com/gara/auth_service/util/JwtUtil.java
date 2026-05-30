package com.gara.auth_service.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtil {

    @Value("${jwt.secret:0ce53a6f85ce5b46c7f3a2d6b85f488ceee6cf74e56ae3492a989e6e11c0307b}")
    private String secret;

    private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 24; // Token sống trong 24 giờ

    private SecretKey getSignKey(){
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
    // Hàm tạo Token khi đăng nhập thành công
    public String generateToken(String username, String roleName){
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", roleName);

        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSignKey())
                .compact();
    }

}
