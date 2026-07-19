package com.abwcurious.restaurant.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface VendorRepository extends JpaRepository<Vendor, Long> {
    Optional<Vendor> findByUuid(String uuid);
    List<Vendor> findByOutletId(Long outletId);
}
