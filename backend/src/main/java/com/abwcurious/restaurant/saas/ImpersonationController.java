package com.abwcurious.restaurant.saas;

import com.abwcurious.restaurant.audit.ImpersonationLog;
import com.abwcurious.restaurant.audit.ImpersonationLogRepository;
import com.abwcurious.restaurant.audit.SaaSAuditLog;
import com.abwcurious.restaurant.audit.SaaSAuditLogRepository;
import com.abwcurious.restaurant.common.ApiResponse;
import com.abwcurious.restaurant.security.CustomUserDetails;
import com.abwcurious.restaurant.security.CustomUserDetailsService;
import com.abwcurious.restaurant.security.JwtTokenProvider;
import com.abwcurious.restaurant.user.User;
import com.abwcurious.restaurant.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/saas/impersonate")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ImpersonationController {

    private final UserRepository userRepository;
    private final CustomUserDetailsService userDetailsService;
    private final JwtTokenProvider tokenProvider;
    private final ImpersonationLogRepository impersonationLogRepository;
    private final SaaSAuditLogRepository saasAuditLogRepository;

    @PostMapping("/{userId}")
    public ApiResponse<Map<String, String>> impersonate(
            @PathVariable Long userId,
            HttpServletRequest request) {
        
        String impersonatorUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        CustomUserDetails userDetails = (CustomUserDetails) userDetailsService.loadUserByUsername(targetUser.getUsername());
        
        String impersonationToken = tokenProvider.generateImpersonationToken(userDetails, impersonatorUsername);

        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null) {
            ipAddress = request.getRemoteAddr();
        } else {
            ipAddress = ipAddress.split(",")[0];
        }

        // Record log
        impersonationLogRepository.save(ImpersonationLog.builder()
                .impersonatorUsername(impersonatorUsername)
                .impersonatedUsername(targetUser.getUsername())
                .impersonatedAt(LocalDateTime.now())
                .ipAddress(ipAddress)
                .build());

        // Log SaaS Audit
        saasAuditLogRepository.save(SaaSAuditLog.builder()
                .username(impersonatorUsername)
                .action("IMPERSONATE_USER")
                .oldValue(impersonatorUsername)
                .newValue(targetUser.getUsername())
                .module("SECURITY")
                .ipAddress(ipAddress)
                .deviceDetails("R360 Corporate Console")
                .createdAt(LocalDateTime.now())
                .build());

        return ApiResponse.success(Map.of("accessToken", impersonationToken), "Impersonation session established");
    }
}
