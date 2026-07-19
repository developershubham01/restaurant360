package com.abwcurious.restaurant.menu;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByUuid(String uuid);
    List<Category> findByOutletIdAndActiveTrue(Long outletId);
}
