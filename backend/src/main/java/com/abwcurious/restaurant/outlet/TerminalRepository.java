package com.abwcurious.restaurant.outlet;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface TerminalRepository extends JpaRepository<Terminal, Long> {
    Optional<Terminal> findByUuid(String uuid);
    Optional<Terminal> findByDeviceIdentifier(String deviceIdentifier);
    List<Terminal> findByOutletIdAndActiveTrue(Long outletId);
}
