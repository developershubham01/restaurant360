package com.abwcurious.restaurant.menu;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface VariantRepository extends JpaRepository<Variant, Long> {
    Optional<Variant> findByUuid(String uuid);
    List<Variant> findByMenuItemIdAndActiveTrue(Long menuItemId);
}
