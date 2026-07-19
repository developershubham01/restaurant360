package com.abwcurious.restaurant.outlet;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface ShiftRepository extends JpaRepository<Shift, Long> {
    Optional<Shift> findByUuid(String uuid);
    Optional<Shift> findByTerminalIdAndStatus(Long terminalId, String status);
    List<Shift> findByOutletId(Long outletId);
}
