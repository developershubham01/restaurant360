package com.abwcurious.restaurant.order;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {
    Optional<Settlement> findByUuid(String uuid);
    List<Settlement> findByShiftId(Long shiftId);
}
