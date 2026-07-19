package com.abwcurious.restaurant.outlet;

import com.abwcurious.restaurant.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/brands")
public class BrandController {

    private final BrandRepository brandRepository;

    public BrandController(BrandRepository brandRepository) {
        this.brandRepository = brandRepository;
    }

    @GetMapping
    public ApiResponse<List<Brand>> getAllBrands() {
        List<Brand> brands = brandRepository.findAll();
        return ApiResponse.success(brands);
    }

    @PostMapping
    @Transactional
    public ApiResponse<Brand> createBrand(
            @RequestParam String name,
            @RequestParam(required = false) String description) {

        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Brand name cannot be empty");
        }

        Brand brand = Brand.builder()
                .uuid(UUID.randomUUID().toString())
                .name(name.trim())
                .description(description)
                .build();

        Brand saved = brandRepository.save(brand);
        return ApiResponse.success(saved, "Brand created successfully");
    }

    @PutMapping("/{id}")
    @Transactional
    public ApiResponse<Brand> updateBrand(
            @PathVariable Long id,
            @RequestParam String name,
            @RequestParam(required = false) String description) {

        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Brand not found"));

        brand.setName(name.trim());
        if (description != null) brand.setDescription(description);

        Brand saved = brandRepository.save(brand);
        return ApiResponse.success(saved, "Brand updated successfully");
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ApiResponse<Void> deleteBrand(@PathVariable Long id) {
        if (!brandRepository.existsById(id)) {
            throw new IllegalArgumentException("Brand not found");
        }
        brandRepository.deleteById(id);
        return ApiResponse.success(null, "Brand deleted successfully");
    }
}
