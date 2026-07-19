package com.abwcurious.restaurant.menu;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface AddonRepository extends JpaRepository<Addon, Long> {
    Optional<Addon> findByUuid(String uuid);
    List<Addon> findByOutletIdAndActiveTrue(Long outletId);
}
