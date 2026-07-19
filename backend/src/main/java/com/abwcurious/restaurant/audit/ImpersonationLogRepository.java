package com.abwcurious.restaurant.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ImpersonationLogRepository extends JpaRepository<ImpersonationLog, Long> {
    List<ImpersonationLog> findAllByOrderByImpersonatedAtDesc();
}
