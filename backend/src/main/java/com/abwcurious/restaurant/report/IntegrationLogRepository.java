package com.abwcurious.restaurant.report;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IntegrationLogRepository extends JpaRepository<IntegrationLog, Long> {
    List<IntegrationLog> findByProviderName(String providerName);
}
