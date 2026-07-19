package com.abwcurious.restaurant.inventory;

import com.abwcurious.restaurant.common.ApiResponse;
import com.abwcurious.restaurant.outlet.Outlet;
import com.abwcurious.restaurant.outlet.OutletRepository;
import com.abwcurious.restaurant.user.User;
import com.abwcurious.restaurant.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final IngredientRepository ingredientRepository;
    private final VendorRepository vendorRepository;
    private final WastageEntryRepository wastageEntryRepository;
    private final OutletRepository outletRepository;
    private final UserRepository userRepository;
    private final IngredientCategoryRepository ingredientCategoryRepository;

    // --- INGREDIENTS ---

    @GetMapping("/ingredients")
    public ApiResponse<List<Ingredient>> getIngredients(@RequestParam Long outletId) {
        List<Ingredient> ingredients = ingredientRepository.findByOutletId(outletId);
        return ApiResponse.success(ingredients);
    }

    @PostMapping("/ingredients")
    public ApiResponse<Ingredient> createIngredient(
            @RequestParam Long outletId,
            @RequestParam String name,
            @RequestParam(required = false) String category,
            @RequestParam String sku,
            @RequestParam String unit,
            @RequestParam BigDecimal minStockLevel,
            @RequestParam(required = false) BigDecimal currentStock) {

        Outlet outlet = outletRepository.findById(outletId)
                .orElseThrow(() -> new IllegalArgumentException("Outlet not found"));

        Ingredient ingredient = Ingredient.builder()
                .outlet(outlet)
                .uuid(UUID.randomUUID().toString())
                .name(name)
                .category(category != null ? category : "General")
                .sku(sku)
                .unit(unit)
                .minStockLevel(minStockLevel)
                .currentStock(currentStock != null ? currentStock : BigDecimal.ZERO)
                .build();

        Ingredient saved = ingredientRepository.save(ingredient);
        return ApiResponse.success(saved, "Ingredient added successfully");
    }

    @PutMapping("/ingredients/{id}/stock")
    public ApiResponse<Ingredient> updateStock(
            @PathVariable Long id,
            @RequestParam BigDecimal currentStock) {

        Ingredient ingredient = ingredientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ingredient not found"));

        ingredient.setCurrentStock(currentStock);
        Ingredient saved = ingredientRepository.save(ingredient);
        return ApiResponse.success(saved, "Stock updated successfully");
    }

    @DeleteMapping("/ingredients/{id}")
    public ApiResponse<Void> deleteIngredient(@PathVariable Long id) {
        ingredientRepository.deleteById(id);
        return ApiResponse.success(null, "Ingredient deleted successfully");
    }

    // --- VENDORS ---

    @GetMapping("/vendors")
    public ApiResponse<List<Vendor>> getVendors(@RequestParam Long outletId) {
        List<Vendor> vendors = vendorRepository.findByOutletId(outletId);
        return ApiResponse.success(vendors);
    }

    @PostMapping("/vendors")
    public ApiResponse<Vendor> createVendor(
            @RequestParam Long outletId,
            @RequestParam String name,
            @RequestParam(required = false) String contactName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String address) {

        Outlet outlet = outletRepository.findById(outletId)
                .orElseThrow(() -> new IllegalArgumentException("Outlet not found"));

        Vendor vendor = Vendor.builder()
                .outlet(outlet)
                .uuid(UUID.randomUUID().toString())
                .name(name)
                .contactName(contactName)
                .email(email)
                .phone(phone)
                .address(address)
                .build();

        Vendor saved = vendorRepository.save(vendor);
        return ApiResponse.success(saved, "Vendor added successfully");
    }

    @DeleteMapping("/vendors/{id}")
    public ApiResponse<Void> deleteVendor(@PathVariable Long id) {
        vendorRepository.deleteById(id);
        return ApiResponse.success(null, "Vendor deleted successfully");
    }

    // --- WASTE LOGS ---

    @GetMapping("/waste")
    public ApiResponse<List<WastageEntry>> getWasteLogs(@RequestParam Long outletId) {
        List<WastageEntry> logs = wastageEntryRepository.findByOutletId(outletId);
        return ApiResponse.success(logs);
    }

    @PostMapping("/waste")
    public ApiResponse<WastageEntry> createWasteEntry(
            @RequestParam Long outletId,
            @RequestParam Long ingredientId,
            @RequestParam BigDecimal quantity,
            @RequestParam String reason,
            @RequestParam Long reportedByUserId) {

        Outlet outlet = outletRepository.findById(outletId)
                .orElseThrow(() -> new IllegalArgumentException("Outlet not found"));

        Ingredient ingredient = ingredientRepository.findById(ingredientId)
                .orElseThrow(() -> new IllegalArgumentException("Ingredient not found"));

        User reportedBy = userRepository.findById(reportedByUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        WastageEntry entry = WastageEntry.builder()
                .outlet(outlet)
                .uuid(UUID.randomUUID().toString())
                .ingredient(ingredient)
                .quantity(quantity)
                .reason(reason)
                .reportedBy(reportedBy)
                .createdAt(java.time.LocalDateTime.now())
                .build();

        // Deduct quantity from ingredient stock
        ingredient.setCurrentStock(ingredient.getCurrentStock().subtract(quantity));
        ingredientRepository.save(ingredient);

        WastageEntry saved = wastageEntryRepository.save(entry);
        return ApiResponse.success(saved, "Wastage logged successfully and stock updated");
    }

    @DeleteMapping("/waste/{id}")
    public ApiResponse<Void> deleteWasteEntry(@PathVariable Long id) {
        wastageEntryRepository.deleteById(id);
        return ApiResponse.success(null, "Wastage entry deleted successfully");
    }

    // --- CUSTOM CATEGORIES ---

    @GetMapping("/categories")
    public ApiResponse<List<IngredientCategory>> getCategories(@RequestParam Long outletId) {
        List<IngredientCategory> categories = ingredientCategoryRepository.findByOutletId(outletId);
        return ApiResponse.success(categories);
    }

    @PostMapping("/categories")
    public ApiResponse<IngredientCategory> createCategory(
            @RequestParam Long outletId,
            @RequestParam String name) {

        Outlet outlet = outletRepository.findById(outletId)
                .orElseThrow(() -> new IllegalArgumentException("Outlet not found"));

        IngredientCategory category = IngredientCategory.builder()
                .outlet(outlet)
                .uuid(UUID.randomUUID().toString())
                .name(name)
                .build();

        IngredientCategory saved = ingredientCategoryRepository.save(category);
        return ApiResponse.success(saved, "Inventory category added successfully");
    }

    @DeleteMapping("/categories/{id}")
    public ApiResponse<Void> deleteCategory(@PathVariable Long id) {
        ingredientCategoryRepository.deleteById(id);
        return ApiResponse.success(null, "Inventory category deleted successfully");
    }
}
