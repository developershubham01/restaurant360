package com.abwcurious.restaurant.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final ConcurrentHashMap<String, RequestTracker> ipTracker = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 100; // 100 requests per minute overall
    private static final int MAX_LOGIN_ATTEMPTS_PER_MINUTE = 10; // max 10 login attempts per minute

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String ip = getClientIP(request);
        String path = request.getRequestURI();

        long now = System.currentTimeMillis();
        RequestTracker tracker = ipTracker.compute(ip, (k, v) -> {
            if (v == null || (now - v.timestamp) > 60000) {
                return new RequestTracker(now, 1, path.contains("/login") ? 1 : 0);
            } else {
                v.requestCount.incrementAndGet();
                if (path.contains("/login")) {
                    v.loginCount.incrementAndGet();
                }
                return v;
            }
        });

        // 429 Too Many Requests check
        if (tracker.requestCount.get() > MAX_REQUESTS_PER_MINUTE) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"success\":false,\"message\":\"Too many requests. Please try again in a minute.\"}");
            return;
        }

        if (path.contains("/login") && tracker.loginCount.get() > MAX_LOGIN_ATTEMPTS_PER_MINUTE) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"success\":false,\"message\":\"Too many login attempts. Please try again in a minute.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }

    private static class RequestTracker {
        final long timestamp;
        final AtomicInteger requestCount;
        final AtomicInteger loginCount;

        RequestTracker(long timestamp, int requestCount, int loginCount) {
            this.timestamp = timestamp;
            this.requestCount = new AtomicInteger(requestCount);
            this.loginCount = new AtomicInteger(loginCount);
        }
    }
}
