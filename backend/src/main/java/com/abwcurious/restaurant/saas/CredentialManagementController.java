package com.abwcurious.restaurant.saas;

import com.abwcurious.restaurant.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/saas/credentials")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class CredentialManagementController {

    private final CredentialManagementService credentialManagementService;

    private String getOperatorName() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        return xf == null ? request.getRemoteAddr() : xf.split(",")[0];
    }

    @PutMapping("/{userId}/reset-password")
    public ApiResponse<Void> resetPassword(
            @PathVariable Long userId,
            @RequestParam String newPassword,
            HttpServletRequest request) {
        credentialManagementService.resetPassword(userId, newPassword, getOperatorName(), getClientIp(request));
        return ApiResponse.success(null, "Password reset successfully");
    }

    @PutMapping("/{userId}/generate-password")
    public ApiResponse<Map<String, String>> generatePassword(
            @PathVariable Long userId,
            HttpServletRequest request) {
        String password = credentialManagementService.generateTemporaryPassword(userId, getOperatorName(), getClientIp(request));
        return ApiResponse.success(Map.of("temporaryPassword", password), "Temporary password generated successfully");
    }

    @PutMapping("/{userId}/force-change")
    public ApiResponse<Void> forcePasswordChange(
            @PathVariable Long userId,
            @RequestParam boolean force,
            HttpServletRequest request) {
        credentialManagementService.forcePasswordChange(userId, force, getOperatorName(), getClientIp(request));
        return ApiResponse.success(null, "Force password change flag updated");
    }

    @PutMapping("/{userId}/change-username")
    public ApiResponse<Void> changeUsername(
            @PathVariable Long userId,
            @RequestParam String username,
            HttpServletRequest request) {
        credentialManagementService.changeUsername(userId, username, getOperatorName(), getClientIp(request));
        return ApiResponse.success(null, "Username changed successfully");
    }

    @PutMapping("/{userId}/change-email")
    public ApiResponse<Void> changeEmail(
            @PathVariable Long userId,
            @RequestParam String email,
            HttpServletRequest request) {
        credentialManagementService.changeEmail(userId, email, getOperatorName(), getClientIp(request));
        return ApiResponse.success(null, "Email changed successfully");
    }

    @PutMapping("/{userId}/change-mobile")
    public ApiResponse<Void> changeMobile(
            @PathVariable Long userId,
            @RequestParam String phone,
            HttpServletRequest request) {
        credentialManagementService.changeMobile(userId, phone, getOperatorName(), getClientIp(request));
        return ApiResponse.success(null, "Mobile number changed successfully");
    }

    @PutMapping("/{userId}/disable-login")
    public ApiResponse<Void> disableLogin(
            @PathVariable Long userId,
            HttpServletRequest request) {
        credentialManagementService.setLoginDisabled(userId, true, getOperatorName(), getClientIp(request));
        return ApiResponse.success(null, "User login access disabled");
    }

    @PutMapping("/{userId}/enable-login")
    public ApiResponse<Void> enableLogin(
            @PathVariable Long userId,
            HttpServletRequest request) {
        credentialManagementService.setLoginDisabled(userId, false, getOperatorName(), getClientIp(request));
        return ApiResponse.success(null, "User login access enabled");
    }

    @PutMapping("/{userId}/lock")
    public ApiResponse<Void> lockAccount(
            @PathVariable Long userId,
            HttpServletRequest request) {
        credentialManagementService.setLocked(userId, true, getOperatorName(), getClientIp(request));
        return ApiResponse.success(null, "User account locked");
    }

    @PutMapping("/{userId}/unlock")
    public ApiResponse<Void> unlockAccount(
            @PathVariable Long userId,
            HttpServletRequest request) {
        credentialManagementService.setLocked(userId, false, getOperatorName(), getClientIp(request));
        return ApiResponse.success(null, "User account unlocked");
    }

    @PostMapping("/{userId}/force-logout")
    public ApiResponse<Void> forceLogout(
            @PathVariable Long userId,
            HttpServletRequest request) {
        credentialManagementService.forceLogout(userId, getOperatorName(), getClientIp(request));
        return ApiResponse.success(null, "All active sessions terminated and user logged out");
    }
}
