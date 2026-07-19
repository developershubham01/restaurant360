package com.abwcurious.restaurant.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SaaSAuditLogRepository extends JpaRepository<SaaSAuditLog, Long> {
    List<SaaSAuditLog> findByBrandId(Long brandId);
}
