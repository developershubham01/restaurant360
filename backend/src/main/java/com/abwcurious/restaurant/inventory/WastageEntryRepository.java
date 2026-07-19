package com.abwcurious.restaurant.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface WastageEntryRepository extends JpaRepository<WastageEntry, Long> {
    Optional<WastageEntry> findByUuid(String uuid);
    List<WastageEntry> findByOutletId(Long outletId);
}
