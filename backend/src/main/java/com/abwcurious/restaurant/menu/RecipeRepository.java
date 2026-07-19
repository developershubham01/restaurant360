package com.abwcurious.restaurant.menu;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    Optional<Recipe> findByUuid(String uuid);
    Optional<Recipe> findByMenuItemIdAndVariantId(Long menuItemId, Long variantId);
    Optional<Recipe> findByMenuItemIdAndVariantIdIsNull(Long menuItemId);
}
