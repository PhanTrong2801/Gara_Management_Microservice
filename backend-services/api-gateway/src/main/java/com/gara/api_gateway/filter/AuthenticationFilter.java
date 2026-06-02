package com.gara.api_gateway.filter;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;

import javax.crypto.SecretKey;

@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    @Value("${jwt.secret:0ce53a6f85ce5b46c7f3a2d6b85f488ceee6cf74e56ae3492a989e6e11c0307b}")
    private String secret;

    public AuthenticationFilter() {
        super(Config.class);
    }

    private SecretKey getSignKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            //chặn khi không có token
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            String token = authHeader.substring(7);

            try {
                io.jsonwebtoken.Claims claims = Jwts.parser()
                        .verifyWith(getSignKey())
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();
                        
                String username = claims.getSubject(); // Trích xuất tên đăng nhập
                Long userId = claims.get("userId", Long.class);

                ServerWebExchange mutatedExchange = exchange.mutate()
                        .request(requestBuilder -> {
                            requestBuilder.header("X-User-Username", username);
                            if (userId != null) {
                                requestBuilder.header("X-User-Id", String.valueOf(userId));
                            }
                        })
                        .build();

                return chain.filter(mutatedExchange);

            } catch (Exception e) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

        };
    }

    public static class Config {
        // Có thể thêm cấu hình tùy chỉnh ở đây nếu cần
    }
}
