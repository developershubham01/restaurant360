package com.abwcurious.restaurant.security;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DeviceSessionRepository extends JpaRepository<DeviceSession, Long> {
    List<DeviceSession> findByBrandId(Long brandId);
    List<DeviceSession> findByUserId(Long userId);
    Optional<DeviceSession> findByDeviceToken(String deviceToken);
}
