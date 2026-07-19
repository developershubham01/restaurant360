package com.abwcurious.restaurant.security;

import com.abwcurious.restaurant.user.User;
import com.abwcurious.restaurant.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class UserResetRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(UserResetRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        log.info("UserResetRunner checking status of seeded default users: admin, owner, cashier1, chef1");
        List<String> defaultUsers = List.of("admin", "owner", "cashier1", "chef1");
        
        for (String username : defaultUsers) {
            userRepository.findByUsername(username).ifPresent(user -> {
                boolean modified = false;
                
                if (user.getPassword() == null || !passwordEncoder.matches("password", user.getPassword())) {
                    String defaultBcrypt = passwordEncoder.encode("password");
                    user.setPassword(defaultBcrypt);
                    modified = true;
                    log.info("Reset password of user '{}' to default 'password'", username);
                }
                
                if (user.isLocked()) {
                    user.setLocked(false);
                    modified = true;
                    log.info("Unlocked user '{}'", username);
                }
                if (user.isLoginDisabled()) {
                    user.setLoginDisabled(false);
                    modified = true;
                    log.info("Enabled login for user '{}'", username);
                }
                if (!user.isActive()) {
                    user.setActive(true);
                    modified = true;
                    log.info("Activated user '{}'", username);
                }
                if (user.getLoginAttemptCount() > 0) {
                    user.setLoginAttemptCount(0);
                    modified = true;
                }
                if (user.isForcePasswordChange()) {
                    user.setForcePasswordChange(false);
                    modified = true;
                }
                
                if (modified) {
                    userRepository.save(user);
                }
            });
        }
        log.info("UserResetRunner verification finished.");
    }
}
