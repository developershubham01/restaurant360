package com.abwcurious.restaurant.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByUuid(String uuid);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    java.util.List<User> findByTenantId(Long tenantId);
}
