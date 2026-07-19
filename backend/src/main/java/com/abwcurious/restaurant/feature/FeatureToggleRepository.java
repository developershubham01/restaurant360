package com.abwcurious.restaurant.feature;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FeatureToggleRepository extends JpaRepository<FeatureToggle, Long> {
    List<FeatureToggle> findByBrandId(Long brandId);
    Optional<FeatureToggle> findByBrandIdAndModuleKey(Long brandId, String moduleKey);
}
