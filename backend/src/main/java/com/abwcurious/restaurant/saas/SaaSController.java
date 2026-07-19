package com.abwcurious.restaurant.saas;

import com.abwcurious.restaurant.common.ApiResponse;
import com.abwcurious.restaurant.outlet.Brand;
import com.abwcurious.restaurant.subscription.SubscriptionPlan;
import com.abwcurious.restaurant.subscription.SubscriptionPlanRepository;
import com.abwcurious.restaurant.licensing.License;
import com.abwcurious.restaurant.feature.FeatureToggle;
import com.abwcurious.restaurant.user.User;
import com.abwcurious.restaurant.user.Role;
import com.abwcurious.restaurant.user.RoleRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/saas")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SaaSController {

    private final SaaSManagementService saasManagementService;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final com.abwcurious.restaurant.audit.SaaSAuditLogRepository saasAuditLogRepository;
    private final com.abwcurious.restaurant.audit.LoginHistoryRepository loginHistoryRepository;
    private final com.abwcurious.restaurant.security.DeviceSessionRepository deviceSessionRepository;
    private final SubscriptionAlertService subscriptionAlertService;
    private final com.abwcurious.restaurant.outlet.BrandRepository brandRepository;
    private final com.abwcurious.restaurant.outlet.OutletRepository outletRepository;
    private final com.abwcurious.restaurant.user.UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/plans")
    public ApiResponse<List<SubscriptionPlan>> getPlans() {
        return ApiResponse.success(subscriptionPlanRepository.findAll());
    }

    @GetMapping("/logs")
    public ApiResponse<List<com.abwcurious.restaurant.audit.SaaSAuditLog>> getAuditLogs() {
        return ApiResponse.success(saasAuditLogRepository.findAll());
    }

    @PostMapping("/restaurants")
    public ApiResponse<Map<String, Object>> createRestaurant(@RequestBody RestaurantCreationRequest request) {
        if (request.getRestaurantName() == null || request.getRestaurantName().isEmpty()) {
            throw new IllegalArgumentException("Restaurant name is required");
        }
        if (request.getOwnerEmail() == null || request.getOwnerEmail().isEmpty()) {
            throw new IllegalArgumentException("Owner email is required");
        }
        if (request.getSubscriptionPlanId() == null) {
            throw new IllegalArgumentException("Subscription plan is required");
        }
        Map<String, Object> response = saasManagementService.createRestaurant(request);
        return ApiResponse.success(response, "Restaurant registered successfully");
    }

    @PutMapping("/restaurants/{tenantId}/subscription")
    public ApiResponse<Brand> updateSubscription(
            @PathVariable Long tenantId,
            @RequestParam(required = false) Long planId,
            @RequestParam(required = false, defaultValue = "0") int addDays) {
        
        Brand updated = saasManagementService.updateSubscription(tenantId, planId, addDays);
        return ApiResponse.success(updated, "Tenant subscription updated successfully");
    }

    @PutMapping("/restaurants/{tenantId}/status")
    public ApiResponse<Brand> updateStatus(
            @PathVariable Long tenantId,
            @RequestParam String status) {
        
        Brand updated = saasManagementService.updateTenantStatus(tenantId, status);
        return ApiResponse.success(updated, "Tenant status set to: " + status);
    }

    @PutMapping("/restaurants/{tenantId}/features")
    public ApiResponse<FeatureToggle> toggleFeature(
            @PathVariable Long tenantId,
            @RequestParam String moduleKey,
            @RequestParam boolean enabled) {
        
        FeatureToggle toggle = saasManagementService.toggleFeature(tenantId, moduleKey, enabled);
        return ApiResponse.success(toggle, "Feature toggle status updated");
    }

    @PostMapping("/restaurants/{tenantId}/licenses")
    public ApiResponse<License> generateLicense(
            @PathVariable Long tenantId,
            @RequestParam String type,
            @RequestParam(defaultValue = "365") int durationDays) {
        
        License license = saasManagementService.generateLicense(tenantId, type, durationDays);
        return ApiResponse.success(license, "SaaS activation license key generated successfully");
    }

    @PutMapping("/restaurants/{tenantId}")
    public ApiResponse<Brand> editRestaurant(
            @PathVariable Long tenantId,
            @RequestBody RestaurantUpdateRequest request) {
        Brand updated = saasManagementService.editRestaurant(tenantId, request);
        return ApiResponse.success(updated, "Restaurant updated successfully");
    }

    @DeleteMapping("/restaurants/{tenantId}")
    public ApiResponse<Brand> deleteRestaurant(@PathVariable Long tenantId) {
        Brand updated = saasManagementService.archiveRestaurant(tenantId);
        return ApiResponse.success(updated, "Restaurant archived/soft-deleted successfully");
    }

    @PutMapping("/restaurants/{tenantId}/suspend")
    public ApiResponse<Brand> suspendRestaurant(
            @PathVariable Long tenantId,
            @RequestParam String reason) {
        Brand updated = saasManagementService.suspendRestaurant(tenantId, reason);
        return ApiResponse.success(updated, "Restaurant suspended");
    }

    @PutMapping("/restaurants/{tenantId}/unsuspend")
    public ApiResponse<Brand> unsuspendRestaurant(@PathVariable Long tenantId) {
        Brand updated = saasManagementService.unsuspendRestaurant(tenantId);
        return ApiResponse.success(updated, "Restaurant unsuspended");
    }

    @PutMapping("/restaurants/{tenantId}/lock")
    public ApiResponse<Brand> lockRestaurant(@PathVariable Long tenantId) {
        Brand updated = saasManagementService.setRestaurantLocked(tenantId, true);
        return ApiResponse.success(updated, "Restaurant locked");
    }

    @PutMapping("/restaurants/{tenantId}/unlock")
    public ApiResponse<Brand> unlockRestaurant(@PathVariable Long tenantId) {
        Brand updated = saasManagementService.setRestaurantLocked(tenantId, false);
        return ApiResponse.success(updated, "Restaurant unlocked");
    }

    @PutMapping("/restaurants/{tenantId}/subscription/pause")
    public ApiResponse<Brand> pauseSubscription(@PathVariable Long tenantId) {
        Brand updated = saasManagementService.pauseSubscription(tenantId);
        return ApiResponse.success(updated, "Subscription paused");
    }

    @PutMapping("/restaurants/{tenantId}/subscription/resume")
    public ApiResponse<Brand> resumeSubscription(@PathVariable Long tenantId) {
        Brand updated = saasManagementService.resumeSubscription(tenantId);
        return ApiResponse.success(updated, "Subscription resumed");
    }

    @PutMapping("/restaurants/{tenantId}/subscription/cancel")
    public ApiResponse<Brand> cancelSubscription(@PathVariable Long tenantId) {
        Brand updated = saasManagementService.cancelSubscription(tenantId);
        return ApiResponse.success(updated, "Subscription cancelled");
    }

    @PutMapping("/restaurants/{tenantId}/subscription/expire")
    public ApiResponse<Brand> expireSubscription(@PathVariable Long tenantId) {
        Brand updated = saasManagementService.expireSubscription(tenantId);
        return ApiResponse.success(updated, "Subscription expired");
    }

    @GetMapping("/restaurants/{tenantId}/login-history")
    public ApiResponse<List<com.abwcurious.restaurant.audit.LoginHistory>> getLoginHistory(@PathVariable Long tenantId) {
        return ApiResponse.success(loginHistoryRepository.findByBrandIdOrderByLoginTimeDesc(tenantId));
    }

    @GetMapping("/restaurants/{tenantId}/devices")
    public ApiResponse<List<com.abwcurious.restaurant.security.DeviceSession>> getDevices(@PathVariable Long tenantId) {
        return ApiResponse.success(deviceSessionRepository.findByBrandId(tenantId));
    }

    @GetMapping("/dashboard/stats")
    public ApiResponse<Map<String, Object>> getDashboardStats() {
        List<Brand> brands = brandRepository.findAllByArchivedFalse();
        long totalBrands = brands.size();
        long activeBrands = brands.stream().filter(b -> "ACTIVE".equalsIgnoreCase(b.getStatus())).count();
        long suspendedBrands = brands.stream().filter(b -> "SUSPENDED".equalsIgnoreCase(b.getStatus())).count();
        long trialBrands = brands.stream().filter(b -> b.getExpiresAt() == null && b.getTrialExpiresAt() != null && b.getTrialExpiresAt().isAfter(java.time.LocalDateTime.now())).count();

        long totalBranches = outletRepository.count();
        long totalUsers = userRepository.count();
        long totalPlans = subscriptionPlanRepository.count();

        java.math.BigDecimal totalMRR = brands.stream()
                .filter(b -> b.getSubscriptionPlan() != null && "ACTIVE".equalsIgnoreCase(b.getStatus()))
                .map(b -> b.getSubscriptionPlan().getMonthlyPrice())
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        Map<String, Object> stats = Map.of(
            "totalRestaurants", totalBrands,
            "activeRestaurants", activeBrands,
            "suspendedRestaurants", suspendedBrands,
            "trialRestaurants", trialBrands,
            "totalBranches", totalBranches,
            "totalUsers", totalUsers,
            "totalPlans", totalPlans,
            "monthlyRevenue", totalMRR
        );
        return ApiResponse.success(stats);
    }

    @GetMapping("/dashboard/alerts")
    public ApiResponse<Map<String, Object>> getDashboardAlerts() {
        return ApiResponse.success(subscriptionAlertService.getSubscriptionAlerts());
    }

    @PostMapping("/plans")
    public ApiResponse<SubscriptionPlan> createPlan(@RequestBody SubscriptionPlan plan) {
        if (plan.getName() == null || plan.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Plan name cannot be empty");
        }
        SubscriptionPlan saved = subscriptionPlanRepository.save(plan);
        return ApiResponse.success(saved, "Subscription plan created successfully");
    }

    @PutMapping("/plans/{id}")
    public ApiResponse<SubscriptionPlan> updatePlan(
            @PathVariable Long id,
            @RequestBody SubscriptionPlan planDetails) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription plan not found"));
        
        plan.setName(planDetails.getName());
        plan.setMaxUsers(planDetails.getMaxUsers());
        plan.setMaxBranches(planDetails.getMaxBranches());
        plan.setMaxProducts(planDetails.getMaxProducts());
        plan.setMaxTables(planDetails.getMaxTables());
        plan.setMaxKitchens(planDetails.getMaxKitchens());
        plan.setMaxPrinters(planDetails.getMaxPrinters());
        plan.setStorageLimitGb(planDetails.getStorageLimitGb());
        plan.setMonthlyPrice(planDetails.getMonthlyPrice());
        plan.setYearlyPrice(planDetails.getYearlyPrice());
        plan.setTrialDays(planDetails.getTrialDays());
        plan.setFeaturesJson(planDetails.getFeaturesJson());

        SubscriptionPlan saved = subscriptionPlanRepository.save(plan);
        return ApiResponse.success(saved, "Subscription plan updated successfully");
    }

    @DeleteMapping("/plans/{id}")
    public ApiResponse<Void> deletePlan(@PathVariable Long id) {
        subscriptionPlanRepository.deleteById(id);
        return ApiResponse.success(null, "Subscription plan deleted successfully");
    }

    @GetMapping("/restaurants/{tenantId}/admin-user")
    public ApiResponse<com.abwcurious.restaurant.user.User> getAdminUser(@PathVariable Long tenantId) {
        List<com.abwcurious.restaurant.user.User> users = userRepository.findByTenantId(tenantId);
        if (users.isEmpty()) {
            throw new IllegalArgumentException("No users registered for this tenant");
        }
        return ApiResponse.success(users.get(0));
    }

    @GetMapping("/restaurants/{tenantId}/branches")
    public ApiResponse<List<com.abwcurious.restaurant.outlet.Outlet>> getTenantBranches(@PathVariable Long tenantId) {
        return ApiResponse.success(outletRepository.findByBrandId(tenantId));
    }

    @PostMapping("/restaurants/{tenantId}/branches")
    public ApiResponse<com.abwcurious.restaurant.outlet.Outlet> createBranch(
            @PathVariable Long tenantId,
            @RequestParam String name,
            @RequestParam String code,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String gst,
            @RequestParam(required = false) String manager,
            @RequestParam(required = false) String workingHours,
            @RequestParam(required = false) Integer tables,
            @RequestParam(required = false) Integer kitchens,
            @RequestParam(required = false) Integer printers,
            @RequestParam(required = false) Integer kds,
            @RequestParam(required = false) String tax) {
        com.abwcurious.restaurant.outlet.Outlet outlet = saasManagementService.createBranch(
                tenantId, name, code, address, phone, gst, manager, workingHours, tables, kitchens, printers, kds, tax);
        return ApiResponse.success(outlet, "Branch created successfully");
    }

    @PutMapping("/branches/{id}")
    public ApiResponse<com.abwcurious.restaurant.outlet.Outlet> updateBranch(
            @PathVariable Long id,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String gst,
            @RequestParam(required = false) String manager,
            @RequestParam(required = false) String workingHours,
            @RequestParam(required = false) Integer tables,
            @RequestParam(required = false) Integer kitchens,
            @RequestParam(required = false) Integer printers,
            @RequestParam(required = false) Integer kds,
            @RequestParam(required = false) String tax,
            @RequestParam(required = false) Boolean active) {
        com.abwcurious.restaurant.outlet.Outlet outlet = saasManagementService.updateBranch(
                id, name, code, address, phone, gst, manager, workingHours, tables, kitchens, printers, kds, tax, active);
        return ApiResponse.success(outlet, "Branch updated successfully");
    }

    @GetMapping("/restaurants/{tenantId}/users")
    public ApiResponse<List<com.abwcurious.restaurant.user.User>> getTenantUsers(@PathVariable Long tenantId) {
        return ApiResponse.success(userRepository.findByTenantId(tenantId));
    }

    @PostMapping("/restaurants/{tenantId}/users")
    public ApiResponse<com.abwcurious.restaurant.user.User> createUser(
            @PathVariable Long tenantId,
            @RequestParam String fullName,
            @RequestParam String username,
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam(required = false) String phone,
            @RequestParam String roleName,
            @RequestParam(required = false) Boolean active) {
        com.abwcurious.restaurant.user.User user = saasManagementService.createUser(
                tenantId, fullName, username, email, password, phone, roleName, active);
        return ApiResponse.success(user, "Tenant user created successfully");
    }

    @GetMapping("/company-members")
    public ApiResponse<List<User>> getCompanyMembers() {
        List<User> admins = userRepository.findAll().stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> "ADMIN".equalsIgnoreCase(r.getName())))
                .toList();
        return ApiResponse.success(admins);
    }

    @PostMapping("/company-members")
    public ApiResponse<User> createCompanyMember(
            @RequestParam String fullName,
            @RequestParam String username,
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false, defaultValue = "true") Boolean active) {
        
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }
        
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new IllegalStateException("ADMIN role not found. Seed first."));
        
        User member = User.builder()
                .uuid(java.util.UUID.randomUUID().toString())
                .fullName(fullName.trim())
                .username(username.trim())
                .email(email.trim())
                .password(passwordEncoder.encode(password))
                .phone(phone)
                .active(active)
                .tenantId(1L) // Default admin tenant
                .build();
        
        member.getRoles().add(adminRole);
        User saved = userRepository.save(member);
        return ApiResponse.success(saved, "Company member created successfully");
    }

    @PutMapping("/company-members/{id}")
    public ApiResponse<User> updateCompanyMember(
            @PathVariable Long id,
            @RequestParam String fullName,
            @RequestParam String email,
            @RequestParam(required = false) String password,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) Boolean active) {
        
        User member = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Company member not found"));
        
        boolean isAdmin = member.getRoles().stream().anyMatch(r -> "ADMIN".equalsIgnoreCase(r.getName()));
        if (!isAdmin) {
            throw new IllegalArgumentException("Target user is not a company member");
        }
        
        if (!member.getEmail().equalsIgnoreCase(email) && userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already in use");
        }
        
        member.setFullName(fullName.trim());
        member.setEmail(email.trim());
        if (phone != null) member.setPhone(phone);
        if (active != null) member.setActive(active);
        if (password != null && !password.trim().isEmpty()) {
            member.setPassword(passwordEncoder.encode(password));
        }
        
        User saved = userRepository.save(member);
        return ApiResponse.success(saved, "Company member updated successfully");
    }

    @DeleteMapping("/company-members/{id}")
    public ApiResponse<Void> deleteCompanyMember(
            @PathVariable Long id) {
        
        User member = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Company member not found"));
        
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName().equalsIgnoreCase(member.getUsername())) {
            throw new IllegalArgumentException("Cannot delete your own admin account");
        }
        
        boolean isAdmin = member.getRoles().stream().anyMatch(r -> "ADMIN".equalsIgnoreCase(r.getName()));
        if (!isAdmin) {
            throw new IllegalArgumentException("Target user is not a company member");
        }
        
        userRepository.delete(member);
        return ApiResponse.success(null, "Company member deleted successfully");
    }

    @PostMapping("/restaurants/{tenantId}/documents")
    public ApiResponse<Brand> uploadDocument(
            @PathVariable Long tenantId,
            @RequestParam String documentType,
            @RequestParam("file") MultipartFile file) {
        
        Brand brand = brandRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));
        
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty");
        }
        
        try {
            String uploadDir = "uploads/documents/" + tenantId + "/";
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            
            String originalFileName = file.getOriginalFilename();
            String cleanName = documentType.toLowerCase() + "_" + System.currentTimeMillis() + "_" + (originalFileName != null ? originalFileName.replaceAll("[^a-zA-Z0-9.-]", "_") : "file.pdf");
            Path targetPath = Paths.get(uploadDir + cleanName);
            
            java.nio.file.Files.copy(file.getInputStream(), targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            
            String fileUrl = "/api/saas/restaurants/" + tenantId + "/documents/download?documentType=" + documentType;
            
            switch (documentType.toUpperCase()) {
                case "SLA":
                    brand.setSlaStatus("UPLOADED");
                    brand.setSlaUrl(fileUrl);
                    break;
                case "NDA":
                    brand.setNdaStatus("UPLOADED");
                    brand.setNdaUrl(fileUrl);
                    break;
                case "LICENSE":
                    brand.setLicenseAgreementStatus("UPLOADED");
                    brand.setLicenseAgreementUrl(fileUrl);
                    break;
                case "GST":
                    brand.setGstCertStatus("UPLOADED");
                    brand.setGstCertUrl(fileUrl);
                    break;
                case "PAN_AADHAR":
                    brand.setPanAadharStatus("UPLOADED");
                    brand.setPanAadharUrl(fileUrl);
                    break;
                case "FSSAI":
                    brand.setFssaiCertStatus("UPLOADED");
                    brand.setFssaiCertUrl(fileUrl);
                    break;
                default:
                    throw new IllegalArgumentException("Unknown document type: " + documentType);
            }
            
            Brand saved = brandRepository.save(brand);
            return ApiResponse.success(saved, "Document uploaded successfully");
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload document: " + e.getMessage(), e);
        }
    }

    @PutMapping("/restaurants/{tenantId}/documents/verify")
    public ApiResponse<Brand> verifyDocument(
            @PathVariable Long tenantId,
            @RequestParam String documentType,
            @RequestParam String status) {
        
        Brand brand = brandRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));
        
        String cleanStatus = status.toUpperCase();
        if (!cleanStatus.equals("VERIFIED") && !cleanStatus.equals("REJECTED") && !cleanStatus.equals("PENDING") && !cleanStatus.equals("UPLOADED")) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }
        
        switch (documentType.toUpperCase()) {
            case "SLA":
                brand.setSlaStatus(cleanStatus);
                break;
            case "NDA":
                brand.setNdaStatus(cleanStatus);
                break;
            case "LICENSE":
                brand.setLicenseAgreementStatus(cleanStatus);
                break;
            case "GST":
                brand.setGstCertStatus(cleanStatus);
                break;
            case "PAN_AADHAR":
                brand.setPanAadharStatus(cleanStatus);
                break;
            case "FSSAI":
                brand.setFssaiCertStatus(cleanStatus);
                break;
            default:
                throw new IllegalArgumentException("Unknown document type: " + documentType);
        }
        
        Brand saved = brandRepository.save(brand);
        return ApiResponse.success(saved, "Document status updated to " + cleanStatus);
    }

    @GetMapping("/restaurants/{tenantId}/documents/download")
    public ResponseEntity<org.springframework.core.io.Resource> downloadDocument(
            @PathVariable Long tenantId,
            @RequestParam String documentType) {
        
        Brand brand = brandRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));
        
        String fileUrl = null;
        switch (documentType.toUpperCase()) {
            case "SLA": fileUrl = brand.getSlaUrl(); break;
            case "NDA": fileUrl = brand.getNdaUrl(); break;
            case "LICENSE": fileUrl = brand.getLicenseAgreementUrl(); break;
            case "GST": fileUrl = brand.getGstCertUrl(); break;
            case "PAN_AADHAR": fileUrl = brand.getPanAadharUrl(); break;
            case "FSSAI": fileUrl = brand.getFssaiCertUrl(); break;
            default: throw new IllegalArgumentException("Unknown document type: " + documentType);
        }
        
        if (fileUrl == null) {
            return ResponseEntity.notFound().build();
        }
        
        try {
            String uploadDir = "uploads/documents/" + tenantId + "/";
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                return ResponseEntity.notFound().build();
            }
            
            File[] files = dir.listFiles((d, name) -> name.toLowerCase().startsWith(documentType.toLowerCase() + "_"));
            if (files == null || files.length == 0) {
                return ResponseEntity.notFound().build();
            }
            
            File targetFile = files[0];
            for (File f : files) {
                if (f.lastModified() > targetFile.lastModified()) {
                    targetFile = f;
                }
            }
            
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(targetFile.toURI());
            if (resource.exists()) {
                String contentType = Files.probeContentType(targetFile.toPath());
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + targetFile.getName() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
