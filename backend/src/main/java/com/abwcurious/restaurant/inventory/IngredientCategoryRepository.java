package com.abwcurious.restaurant.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface IngredientCategoryRepository extends JpaRepository<IngredientCategory, Long> {
    Optional<IngredientCategory> findByUuid(String uuid);
    List<IngredientCategory> findByOutletId(Long outletId);
}
