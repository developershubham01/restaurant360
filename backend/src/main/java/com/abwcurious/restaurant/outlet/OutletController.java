package com.abwcurious.restaurant.outlet;

import com.abwcurious.restaurant.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/outlets")
public class OutletController {

    private final OutletRepository outletRepository;
    private final BrandRepository brandRepository;

    public OutletController(OutletRepository outletRepository, BrandRepository brandRepository) {
        this.outletRepository = outletRepository;
        this.brandRepository = brandRepository;
    }

    @GetMapping
    public ApiResponse<List<Outlet>> getAllOutlets() {
        List<Outlet> outlets = outletRepository.findAll();
        return ApiResponse.success(outlets);
    }

    @GetMapping("/{id}")
    public ApiResponse<Outlet> getOutletById(@PathVariable Long id) {
        Outlet outlet = outletRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Branch outlet not found"));
        return ApiResponse.success(outlet);
    }

    @PostMapping
    @Transactional
    public ApiResponse<Outlet> createOutlet(
            @RequestParam String name,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String gstNumber) {

        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Outlet name cannot be empty");
        }

        // Get default brand
        Brand brand = brandRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Default brand not found. Seed first."));

        Outlet outlet = Outlet.builder()
                .uuid(UUID.randomUUID().toString())
                .brand(brand)
                .name(name.trim())
                .address(address)
                .phone(phone)
                .gstNumber(gstNumber)
                .active(true)
                .build();

        Outlet saved = outletRepository.save(outlet);
        return ApiResponse.success(saved, "Branch outlet created successfully");
    }

    @PutMapping("/{id}")
    @Transactional
    public ApiResponse<Outlet> updateOutlet(
            @PathVariable Long id,
            @RequestParam String name,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String gstNumber,
            @RequestParam(required = false) String fssaiNumber,
            @RequestParam(required = false) Double cgstRate,
            @RequestParam(required = false) Double sgstRate,
            @RequestParam(required = false) Double serviceChargeRate,
            @RequestParam(required = false) Double packagingCharge,
            @RequestParam(required = false) Boolean active) {

        Outlet outlet = outletRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Branch outlet not found"));

        outlet.setName(name.trim());
        if (address != null) outlet.setAddress(address);
        if (phone != null) outlet.setPhone(phone);
        if (gstNumber != null) outlet.setGstNumber(gstNumber);
        if (fssaiNumber != null) outlet.setFssaiNumber(fssaiNumber);
        if (cgstRate != null) outlet.setCgstRate(cgstRate);
        if (sgstRate != null) outlet.setSgstRate(sgstRate);
        if (serviceChargeRate != null) outlet.setServiceChargeRate(serviceChargeRate);
        if (packagingCharge != null) outlet.setPackagingCharge(packagingCharge);
        if (active != null) outlet.setActive(active);

        Outlet saved = outletRepository.save(outlet);
        return ApiResponse.success(saved, "Branch outlet updated successfully");
    }

    @PutMapping("/{id}/transfer")
    @Transactional
    public ApiResponse<Outlet> transferOutlet(
            @PathVariable Long id,
            @RequestParam Long newBrandId) {
        Outlet outlet = outletRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Branch outlet not found"));
        Brand newBrand = brandRepository.findById(newBrandId)
                .orElseThrow(() -> new IllegalArgumentException("Target restaurant brand not found"));
        
        outlet.setBrand(newBrand);
        outlet.setTenantId(newBrandId); // Maintain RLS mapping alignment
        Outlet saved = outletRepository.save(outlet);
        return ApiResponse.success(saved, "Branch transferred to restaurant chain successfully");
    }

    @PutMapping("/{id}/activate")
    @Transactional
    public ApiResponse<Outlet> activateOutlet(@PathVariable Long id) {
        Outlet outlet = outletRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Branch outlet not found"));
        outlet.setActive(true);
        Outlet saved = outletRepository.save(outlet);
        return ApiResponse.success(saved, "Branch activated");
    }

    @PutMapping("/{id}/deactivate")
    @Transactional
    public ApiResponse<Outlet> deactivateOutlet(@PathVariable Long id) {
        Outlet outlet = outletRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Branch outlet not found"));
        outlet.setActive(false);
        Outlet saved = outletRepository.save(outlet);
        return ApiResponse.success(saved, "Branch deactivated");
    }
}
