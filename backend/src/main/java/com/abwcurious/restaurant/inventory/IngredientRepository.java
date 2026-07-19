package com.abwcurious.restaurant.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {
    Optional<Ingredient> findByUuid(String uuid);
    Optional<Ingredient> findBySku(String sku);
    List<Ingredient> findByOutletId(Long outletId);
}
