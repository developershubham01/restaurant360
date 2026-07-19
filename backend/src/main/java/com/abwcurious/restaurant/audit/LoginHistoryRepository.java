package com.abwcurious.restaurant.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {
    List<LoginHistory> findByBrandIdOrderByLoginTimeDesc(Long brandId);
}
