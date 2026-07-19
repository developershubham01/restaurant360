package com.abwcurious.restaurant.outlet;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface OutletRepository extends JpaRepository<Outlet, Long> {
    Optional<Outlet> findByUuid(String uuid);
    List<Outlet> findByActiveTrue();
    List<Outlet> findByBrandId(Long brandId);
}
