package com.abwcurious.restaurant.feature;

import com.abwcurious.restaurant.common.ApiResponse;
import com.abwcurious.restaurant.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/features")
@RequiredArgsConstructor
public class FeatureToggleController {

    private final FeatureToggleRepository featureToggleRepository;

    @GetMapping
    public ApiResponse<Map<String, Boolean>> getTenantFeatures() {
        Long tenantId = TenantContext.getCurrentTenant();
        Map<String, Boolean> features = new HashMap<>();
        
        if (tenantId != null) {
            List<FeatureToggle> toggles = featureToggleRepository.findByBrandId(tenantId);
            for (FeatureToggle toggle : toggles) {
                features.put(toggle.getModuleKey(), toggle.isEnabled());
            }
        }
        
        return ApiResponse.success(features);
    }
}
