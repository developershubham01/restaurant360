package com.abwcurious.restaurant.menu;

import com.abwcurious.restaurant.common.ApiResponse;
import com.abwcurious.restaurant.outlet.Outlet;
import com.abwcurious.restaurant.outlet.OutletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MenuController {

    private final CategoryRepository categoryRepository;
    private final MenuItemRepository menuItemRepository;
    private final OutletRepository outletRepository;

    @GetMapping("/categories")
    public ApiResponse<List<Category>> getCategories(@RequestParam Long outletId) {
        List<Category> categories = categoryRepository.findByOutletIdAndActiveTrue(outletId);
        return ApiResponse.success(categories);
    }

    @GetMapping("/menu-items")
    public ApiResponse<List<MenuItem>> getMenuItems(@RequestParam Long outletId) {
        List<MenuItem> menuItems = menuItemRepository.findByCategoryOutletIdAndActiveTrue(outletId);
        return ApiResponse.success(menuItems);
    }

    @PostMapping("/categories")
    public ApiResponse<Category> createCategory(
            @RequestParam Long outletId,
            @RequestParam String name,
            @RequestParam(required = false) String description) {
        Outlet outlet = outletRepository.findById(outletId)
                .orElseThrow(() -> new IllegalArgumentException("Outlet not found"));
        Category category = Category.builder()
                .outlet(outlet)
                .name(name)
                .description(description)
                .active(true)
                .build();
        Category saved = categoryRepository.save(category);
        return ApiResponse.success(saved, "Category created successfully");
    }

    @PostMapping("/menu-items")
    public ApiResponse<MenuItem> createMenuItem(
            @RequestParam Long categoryId,
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String sku,
            @RequestParam java.math.BigDecimal basePrice,
            @RequestParam(required = false) java.math.BigDecimal taxRate) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));
        MenuItem menuItem = MenuItem.builder()
                .category(category)
                .name(name)
                .description(description)
                .sku(sku != null && !sku.trim().isEmpty() ? sku : "SKU-" + System.currentTimeMillis())
                .basePrice(basePrice)
                .taxRate(taxRate != null ? taxRate : java.math.BigDecimal.ZERO)
                .active(true)
                .build();
        MenuItem saved = menuItemRepository.save(menuItem);
        return ApiResponse.success(saved, "Menu item created successfully");
    }

    @DeleteMapping("/menu-items/{id}")
    public ApiResponse<Void> deleteMenuItem(@PathVariable Long id) {
        MenuItem menuItem = menuItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Menu item not found"));
        menuItem.setActive(false);
        menuItemRepository.save(menuItem);
        return ApiResponse.success(null, "Menu item deleted successfully");
    }

    @PutMapping("/menu-items/{id}")
    public ApiResponse<MenuItem> updateMenuItem(
            @PathVariable Long id,
            @RequestParam(required = false) Long categoryId,
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String sku,
            @RequestParam java.math.BigDecimal basePrice,
            @RequestParam(required = false) java.math.BigDecimal taxRate,
            @RequestParam(required = false) Boolean active) {

        MenuItem menuItem = menuItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Menu item not found"));

        if (categoryId != null) {
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));
            menuItem.setCategory(category);
        }

        menuItem.setName(name);
        menuItem.setDescription(description);
        if (sku != null) menuItem.setSku(sku);
        menuItem.setBasePrice(basePrice);
        if (taxRate != null) menuItem.setTaxRate(taxRate);
        if (active != null) menuItem.setActive(active);

        MenuItem saved = menuItemRepository.save(menuItem);
        return ApiResponse.success(saved, "Menu item updated successfully");
    }
}
