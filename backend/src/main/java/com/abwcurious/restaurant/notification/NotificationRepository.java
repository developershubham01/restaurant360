package com.abwcurious.restaurant.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByBrandIdOrderByCreatedAtDesc(Long brandId);
    List<Notification> findByIsReadFalseOrderByCreatedAtDesc();
}
