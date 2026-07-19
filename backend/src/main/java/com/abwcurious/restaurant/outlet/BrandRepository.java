package com.abwcurious.restaurant.outlet;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BrandRepository extends JpaRepository<Brand, Long> {
    Optional<Brand> findByUuid(String uuid);
    java.util.List<Brand> findAllByArchivedFalse();
}
