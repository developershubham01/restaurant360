package com.abwcurious.restaurant.saas;

import com.abwcurious.restaurant.audit.PasswordHistory;
import com.abwcurious.restaurant.audit.PasswordHistoryRepository;
import com.abwcurious.restaurant.audit.SaaSAuditLog;
import com.abwcurious.restaurant.audit.SaaSAuditLogRepository;
import com.abwcurious.restaurant.security.DeviceSession;
import com.abwcurious.restaurant.security.DeviceSessionRepository;
import com.abwcurious.restaurant.user.User;
import com.abwcurious.restaurant.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CredentialManagementService {

    private final UserRepository userRepository;
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final DeviceSessionRepository deviceSessionRepository;
    private final SaaSAuditLogRepository saasAuditLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void resetPassword(Long userId, String newPassword, String operatorName, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String oldHash = user.getPassword();
        String newHash = passwordEncoder.encode(newPassword);
        user.setPassword(newHash);
        user.setForcePasswordChange(true); // Always force change on admin reset
        userRepository.save(user);

        // Record password history
        passwordHistoryRepository.save(PasswordHistory.builder()
                .user(user)
                .passwordHash(newHash)
                .changedAt(LocalDateTime.now())
                .build());

        // Log SaaS audit
        saasAuditLogRepository.save(SaaSAuditLog.builder()
                .username(operatorName)
                .action("RESET_PASSWORD")
                .oldValue("[REDACTED]")
                .newValue("[REDACTED]")
                .module("CREDENTIALS")
                .ipAddress(ipAddress)
                .deviceDetails("R360 Corporate Console")
                .createdAt(LocalDateTime.now())
                .build());
    }

    @Transactional
    public String generateTemporaryPassword(Long userId, String operatorName, String ipAddress) {
        String tempPassword = UUID.randomUUID().toString().replaceAll("-", "").substring(0, 10);
        resetPassword(userId, tempPassword, operatorName, ipAddress);
        return tempPassword;
    }

    @Transactional
    public void forcePasswordChange(Long userId, boolean force, String operatorName, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean oldVal = user.isForcePasswordChange();
        user.setForcePasswordChange(force);
        userRepository.save(user);

        saasAuditLogRepository.save(SaaSAuditLog.builder()
                .username(operatorName)
                .action("FORCE_PASSWORD_CHANGE_SET")
                .oldValue(String.valueOf(oldVal))
                .newValue(String.valueOf(force))
                .module("CREDENTIALS")
                .ipAddress(ipAddress)
                .deviceDetails("R360 Corporate Console")
                .createdAt(LocalDateTime.now())
                .build());
    }

    @Transactional
    public void changeUsername(Long userId, String newUsername, String operatorName, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String oldVal = user.getUsername();
        user.setUsername(newUsername);
        userRepository.save(user);

        saasAuditLogRepository.save(SaaSAuditLog.builder()
                .username(operatorName)
                .action("CHANGE_USERNAME")
                .oldValue(oldVal)
                .newValue(newUsername)
                .module("CREDENTIALS")
                .ipAddress(ipAddress)
                .deviceDetails("R360 Corporate Console")
                .createdAt(LocalDateTime.now())
                .build());
    }

    @Transactional
    public void changeEmail(Long userId, String newEmail, String operatorName, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String oldVal = user.getEmail();
        user.setEmail(newEmail);
        userRepository.save(user);

        saasAuditLogRepository.save(SaaSAuditLog.builder()
                .username(operatorName)
                .action("CHANGE_EMAIL")
                .oldValue(oldVal)
                .newValue(newEmail)
                .module("CREDENTIALS")
                .ipAddress(ipAddress)
                .deviceDetails("R360 Corporate Console")
                .createdAt(LocalDateTime.now())
                .build());
    }

    @Transactional
    public void changeMobile(Long userId, String newMobile, String operatorName, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String oldVal = user.getPhone();
        user.setPhone(newMobile);
        userRepository.save(user);

        saasAuditLogRepository.save(SaaSAuditLog.builder()
                .username(operatorName)
                .action("CHANGE_MOBILE")
                .oldValue(oldVal)
                .newValue(newMobile)
                .module("CREDENTIALS")
                .ipAddress(ipAddress)
                .deviceDetails("R360 Corporate Console")
                .createdAt(LocalDateTime.now())
                .build());
    }

    @Transactional
    public void setLoginDisabled(Long userId, boolean disabled, String operatorName, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean oldVal = user.isLoginDisabled();
        user.setLoginDisabled(disabled);
        userRepository.save(user);

        saasAuditLogRepository.save(SaaSAuditLog.builder()
                .username(operatorName)
                .action(disabled ? "DISABLE_LOGIN" : "ENABLE_LOGIN")
                .oldValue(String.valueOf(oldVal))
                .newValue(String.valueOf(disabled))
                .module("CREDENTIALS")
                .ipAddress(ipAddress)
                .deviceDetails("R360 Corporate Console")
                .createdAt(LocalDateTime.now())
                .build());
    }

    @Transactional
    public void setLocked(Long userId, boolean locked, String operatorName, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean oldVal = user.isLocked();
        user.setLocked(locked);
        if (!locked) {
            user.setLoginAttemptCount(0); // Reset attempts on unlock
        }
        userRepository.save(user);

        saasAuditLogRepository.save(SaaSAuditLog.builder()
                .username(operatorName)
                .action(locked ? "LOCK_ACCOUNT" : "UNLOCK_ACCOUNT")
                .oldValue(String.valueOf(oldVal))
                .newValue(String.valueOf(locked))
                .module("CREDENTIALS")
                .ipAddress(ipAddress)
                .deviceDetails("R360 Corporate Console")
                .createdAt(LocalDateTime.now())
                .build());
    }

    @Transactional
    public void forceLogout(Long userId, String operatorName, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<DeviceSession> activeSessions = deviceSessionRepository.findByUserId(userId);
        for (DeviceSession session : activeSessions) {
            session.setActive(false);
            deviceSessionRepository.save(session);
        }

        saasAuditLogRepository.save(SaaSAuditLog.builder()
                .username(operatorName)
                .action("FORCE_LOGOUT")
                .oldValue("SESSIONS_COUNT: " + activeSessions.size())
                .newValue("LOGGED_OUT")
                .module("CREDENTIALS")
                .ipAddress(ipAddress)
                .deviceDetails("R360 Corporate Console")
                .createdAt(LocalDateTime.now())
                .build());
    }
}
