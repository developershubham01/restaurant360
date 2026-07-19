package com.abwcurious.restaurant.saas;

import com.abwcurious.restaurant.outlet.Brand;
import com.abwcurious.restaurant.outlet.BrandRepository;
import com.abwcurious.restaurant.outlet.Outlet;
import com.abwcurious.restaurant.outlet.OutletRepository;
import com.abwcurious.restaurant.subscription.SubscriptionPlan;
import com.abwcurious.restaurant.subscription.SubscriptionPlanRepository;
import com.abwcurious.restaurant.licensing.License;
import com.abwcurious.restaurant.licensing.LicenseRepository;
import com.abwcurious.restaurant.feature.FeatureToggle;
import com.abwcurious.restaurant.feature.FeatureToggleRepository;
import com.abwcurious.restaurant.user.Role;
import com.abwcurious.restaurant.user.RoleRepository;
import com.abwcurious.restaurant.user.User;
import com.abwcurious.restaurant.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SaaSManagementService {

    private final BrandRepository brandRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final LicenseRepository licenseRepository;
    private final FeatureToggleRepository featureToggleRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OutletRepository outletRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.abwcurious.restaurant.audit.SaaSAuditLogRepository saasAuditLogRepository;

    @Transactional
    public Map<String, Object> createRestaurant(RestaurantCreationRequest req) {
        log.info("SaaS onboarding: Creating new restaurant tenant: {}", req.getRestaurantName());

        if (userRepository.existsByUsername(req.getOwnerEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("Owner email '" + req.getOwnerEmail().trim() + "' is already registered as a username.");
        }
        if (userRepository.existsByEmail(req.getOwnerEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("Owner email '" + req.getOwnerEmail().trim() + "' is already registered as an email address.");
        }

        // 1. Fetch Subscription Plan
        SubscriptionPlan plan = subscriptionPlanRepository.findById(req.getSubscriptionPlanId())
                .orElseThrow(() -> new IllegalArgumentException("Subscription plan not found"));

        // 2. Create Brand (Tenant)
        int trialDays = req.getTrialDays() != null ? req.getTrialDays() : plan.getTrialDays();
        LocalDateTime trialExpiry = LocalDateTime.now().plusDays(trialDays);
        LocalDateTime expiry = LocalDateTime.now().plusDays(trialDays + 30); // Base expiration

        Brand brand = Brand.builder()
                .uuid(UUID.randomUUID().toString())
                .name(req.getRestaurantName().trim())
                .description(req.getRestaurantName() + " Enterprise Group")
                .ownerName(req.getOwnerName().trim())
                .ownerEmail(req.getOwnerEmail().trim().toLowerCase())
                .ownerMobile(req.getOwnerMobile().trim())
                .gstNumber(req.getGstNumber() != null ? req.getGstNumber().trim() : "")
                .panNumber(req.getPanNumber() != null ? req.getPanNumber().trim() : "")
                .address(req.getAddress() != null ? req.getAddress().trim() : "")
                .city(req.getCity() != null ? req.getCity().trim() : "")
                .state(req.getState() != null ? req.getState().trim() : "")
                .country(req.getCountry() != null ? req.getCountry().trim() : "")
                .pinCode(req.getPinCode() != null ? req.getPinCode().trim() : "")
                .maxUsersAllowed(req.getMaxUsersAllowed())
                .maxBranchesAllowed(req.getMaxBranchesAllowed())
                .subscriptionPlan(plan)
                .status("ACTIVE")
                .trialExpiresAt(trialExpiry)
                .expiresAt(expiry)
                .currency(req.getCurrency() != null ? req.getCurrency() : "INR")
                .timezone(req.getTimezone() != null ? req.getTimezone() : "Asia/Kolkata")
                .logoUrl(req.getLogoUrl())
                .createdAt(LocalDateTime.now())
                .build();

        Brand savedBrand = brandRepository.save(brand);
        Long tenantId = savedBrand.getId();

        // 3. Seed Default Feature Toggles
        List<String> defaultModules = Arrays.asList(
                "POS", "KITCHEN_DISPLAY", "CRM", "INVENTORY", 
                "REPORTS", "ANALYTICS", "TABLE_RESERVATION", 
                "QR_ORDERING", "ONLINE_ORDERS", "LOYALTY_PROGRAM", "RECIPE_MANAGEMENT"
        );
        for (String module : defaultModules) {
            FeatureToggle toggle = FeatureToggle.builder()
                    .brand(savedBrand)
                    .moduleKey(module)
                    .enabled(true)
                    .build();
            featureToggleRepository.save(toggle);
        }

        // 4. Generate Temporary Password
        String tempPassword = "Resto360@" + (1000 + new Random().nextInt(9000));

        // 5. Create Owner User
        Role ownerRole = roleRepository.findByName("OWNER")
                .orElseThrow(() -> new IllegalStateException("OWNER role not found in database"));

        User user = User.builder()
                .uuid(UUID.randomUUID().toString())
                .username(req.getOwnerEmail().trim().toLowerCase())
                .email(req.getOwnerEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(tempPassword))
                .fullName(req.getOwnerName().trim())
                .phone(req.getOwnerMobile().trim())
                .active(true)
                .tenantId(tenantId)
                .roles(Set.of(ownerRole))
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        // 6. Create Default Main Outlet/Branch
        Outlet outlet = Outlet.builder()
                .uuid(UUID.randomUUID().toString())
                .brand(savedBrand)
                .name(req.getRestaurantName().trim() + " Main Branch")
                .address(req.getAddress() != null ? req.getAddress().trim() : "")
                .phone(req.getOwnerMobile().trim())
                .gstNumber(req.getGstNumber() != null ? req.getGstNumber().trim() : "")
                .active(true)
                .tenantId(tenantId)
                .build();

        outletRepository.save(outlet);

        // 7. Generate Cloud License Key
        String licenseKey = "LIC-" + UUID.randomUUID().toString().replaceAll("-", "").substring(0, 16).toUpperCase();
        License license = License.builder()
                .brand(savedBrand)
                .licenseKey(licenseKey)
                .type("CLOUD")
                .status("ACTIVE")
                .activatedAt(LocalDateTime.now())
                .expiresAt(expiry)
                .build();

        licenseRepository.save(license);

        // 8. Assemble response details
        Map<String, Object> result = new HashMap<>();
        result.put("tenantId", tenantId);
        result.put("uuid", savedBrand.getUuid());
        result.put("restaurantName", savedBrand.getName());
        result.put("ownerUsername", user.getUsername());
        result.put("temporaryPassword", tempPassword);
        result.put("licenseKey", licenseKey);
        result.put("planName", plan.getName());

        saasAuditLogRepository.save(com.abwcurious.restaurant.audit.SaaSAuditLog.builder()
                .brand(savedBrand)
                .username("SUPER_ADMIN")
                .action("ONBOARDED_RESTAURANT")
                .ipAddress("127.0.0.1")
                .deviceDetails("R360 Corporate Console")
                .createdAt(LocalDateTime.now())
                .build());

        log.info("SaaS onboarding completed for tenant: {}. Owner account: {}", savedBrand.getName(), user.getUsername());
        return result;
    }

    @Transactional
    public Brand updateSubscription(Long tenantId, Long planId, int addDays) {
        Brand brand = brandRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant brand not found"));

        if (planId != null) {
            SubscriptionPlan plan = subscriptionPlanRepository.findById(planId)
                    .orElseThrow(() -> new IllegalArgumentException("Subscription plan not found"));
            brand.setSubscriptionPlan(plan);
        }

        if (addDays > 0) {
            LocalDateTime currentExpiry = brand.getExpiresAt();
            if (currentExpiry == null || currentExpiry.isBefore(LocalDateTime.now())) {
                brand.setExpiresAt(LocalDateTime.now().plusDays(addDays));
            } else {
                brand.setExpiresAt(currentExpiry.plusDays(addDays));
            }
        }

        Brand saved = brandRepository.save(brand);
        saasAuditLogRepository.save(com.abwcurious.restaurant.audit.SaaSAuditLog.builder()
                .brand(saved)
                .username("SUPER_ADMIN")
                .action("UPDATED_SUBSCRIPTION_PLAN_OR_EXPIRY")
                .ipAddress("127.0.0.1")
                .deviceDetails("R360 Corporate Console")
                .createdAt(LocalDateTime.now())
                .build());
        return saved;
    }

    @Transactional
    public Brand updateTenantStatus(Long tenantId, String status) {
        Brand brand = brandRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant brand not found"));
        
        List<String> validStatuses = Arrays.asList("ACTIVE", "INACTIVE", "SUSPENDED");
        if (!validStatuses.contains(status.toUpperCase())) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }

        brand.setStatus(status.toUpperCase());
        Brand saved = brandRepository.save(brand);
        saasAuditLogRepository.save(com.abwcurious.restaurant.audit.SaaSAuditLog.builder()
                .brand(saved)
                .username("SUPER_ADMIN")
                .action("CHANGED_STATUS_TO_" + status.toUpperCase())
                .ipAddress("127.0.0.1")
                .deviceDetails("R360 Corporate Console")
                .createdAt(LocalDateTime.now())
                .build());
        return saved;
    }

    @Transactional
    public FeatureToggle toggleFeature(Long tenantId, String moduleKey, boolean enabled) {
        Brand brand = brandRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant brand not found"));

        FeatureToggle toggle = featureToggleRepository.findByBrandIdAndModuleKey(tenantId, moduleKey)
                .orElse(FeatureToggle.builder()
                        .brand(brand)
                        .moduleKey(moduleKey)
                        .build());

        toggle.setEnabled(enabled);
        FeatureToggle saved = featureToggleRepository.save(toggle);
        saasAuditLogRepository.save(com.abwcurious.restaurant.audit.SaaSAuditLog.builder()
                .brand(brand)
                .username("SUPER_ADMIN")
                .action("TOGGLED_FEATURE_" + moduleKey + "_TO_" + enabled)
                .ipAddress("127.0.0.1")
                .deviceDetails("R360 Corporate Console")
                .createdAt(LocalDateTime.now())
                .build());
        return saved;
    }

    @Transactional
    public License generateLicense(Long tenantId, String type, int durationDays) {
        Brand brand = brandRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant brand not found"));

        String licenseKey = "LIC-" + UUID.randomUUID().toString().replaceAll("-", "").substring(0, 16).toUpperCase();
        License license = License.builder()
                .brand(brand)
                .licenseKey(licenseKey)
                .type(type.toUpperCase())
                .status("ACTIVE")
                .activatedAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusDays(durationDays))
                .build();

        License saved = licenseRepository.save(license);
        saasAuditLogRepository.save(com.abwcurious.restaurant.audit.SaaSAuditLog.builder()
                .brand(brand)
                .username("SUPER_ADMIN")
                .action("GENERATED_LICENSE_KEY_" + type.toUpperCase())
                .ipAddress("127.0.0.1")
                .deviceDetails("R360 Corporate Console")
                .createdAt(LocalDateTime.now())
                .build());
        return saved;
    }

    @Transactional
    public Brand editRestaurant(Long tenantId, RestaurantUpdateRequest req) {
        Brand brand = brandRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant brand not found"));
        
        String oldName = brand.getName();
        String oldEmail = brand.getOwnerEmail();
        String oldMobile = brand.getOwnerMobile();

        if (req.getRestaurantName() != null) brand.setName(req.getRestaurantName());
        if (req.getOwnerEmail() != null) brand.setOwnerEmail(req.getOwnerEmail());
        if (req.getOwnerMobile() != null) brand.setOwnerMobile(req.getOwnerMobile());
        if (req.getOwnerName() != null) brand.setOwnerName(req.getOwnerName());
        if (req.getGstNumber() != null) brand.setGstNumber(req.getGstNumber());
        if (req.getPanNumber() != null) brand.setPanNumber(req.getPanNumber());
        if (req.getAddress() != null) brand.setAddress(req.getAddress());
        if (req.getCity() != null) brand.setCity(req.getCity());
        if (req.getState() != null) brand.setState(req.getState());
        if (req.getCountry() != null) brand.setCountry(req.getCountry());
        if (req.getPinCode() != null) brand.setPinCode(req.getPinCode());
        if (req.getCurrency() != null) brand.setCurrency(req.getCurrency());
        if (req.getTimezone() != null) brand.setTimezone(req.getTimezone());
        if (req.getLogoUrl() != null) brand.setLogoUrl(req.getLogoUrl());
        if (req.getMaxUsersAllowed() != null) brand.setMaxUsersAllowed(req.getMaxUsersAllowed());
        if (req.getMaxBranchesAllowed() != null) brand.setMaxBranchesAllowed(req.getMaxBranchesAllowed());

        Brand saved = brandRepository.save(brand);

        saasAuditLogRepository.save(com.abwcurious.restaurant.audit.SaaSAuditLog.builder()
                .brand(saved)
                .username("SUPER_ADMIN")
                .action("EDIT_RESTAURANT")
                .oldValue(String.format("Name: %s, Email: %s, Mobile: %s", oldName, oldEmail, oldMobile))
                .newValue(String.format("Name: %s, Email: %s, Mobile: %s", saved.getName(), saved.getOwnerEmail(), saved.getOwnerMobile()))
                .module("TENANTS")
                .createdAt(LocalDateTime.now())
                .build());

        return saved;
    }

    @Transactional
    public Brand suspendRestaurant(Long tenantId, String reason) {
        Brand brand = brandRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant brand not found"));
        
        brand.setStatus("SUSPENDED");
        brand.setSuspendedAt(LocalDateTime.now());
        brand.setSuspendedReason(reason);
        Brand saved = brandRepository.save(brand);

        saasAuditLogRepository.save(com.abwcurious.restaurant.audit.SaaSAuditLog.builder()
                .brand(saved)
                .username("SUPER_ADMIN")
                .action("SUSPEND_RESTAURANT")
                .oldValue("ACTIVE")
                .newValue("SUSPENDED: " + reason)
                .module("TENANTS")
                .createdAt(LocalDateTime.now())
                .build());

        return saved;
    }

    @Transactional
    public Brand unsuspendRestaurant(Long tenantId) {
        Brand brand = brandRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant brand not found"));
        
        brand.setStatus("ACTIVE");
        brand.setSuspendedAt(null);
        brand.setSuspendedReason(null);
        Brand saved = brandRepository.save(brand);

        saasAuditLogRepository.save(com.abwcurious.restaurant.audit.SaaSAuditLog.builder()
                .brand(saved)
                .username("SUPER_ADMIN")
                .action("UNSUSPEND_RESTAURANT")
                .oldValue("SUSPENDED")
                .newValue("ACTIVE")
                .module("TENANTS")
                .createdAt(LocalDateTime.now())
                .build());

        return saved;
    }

    @Transactional
    public Brand setRestaurantLocked(Long tenantId, boolean locked) {
        Brand brand = brandRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant brand not found"));
        
        boolean oldVal = brand.isLocked();
        brand.setLocked(locked);
        Brand saved = brandRepository.save(brand);

        saasAuditLogRepository.save(com.abwcurious.restaurant.audit.SaaSAuditLog.builder()
                .brand(saved)
                .username("SUPER_ADMIN")
                .action(locked ? "LOCK_RESTAURANT" : "UNLOCK_RESTAURANT")
                .oldValue(String.valueOf(oldVal))
                .newValue(String.valueOf(locked))
                .module("TENANTS")
                .createdAt(LocalDateTime.now())
                .build());

        return saved;
    }

    @Transactional
    public Brand archiveRestaurant(Long tenantId) {
        Brand brand = brandRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant brand not found"));
        
        brand.setArchived(true);
        Brand saved = brandRepository.save(brand);

        saasAuditLogRepository.save(com.abwcurious.restaurant.audit.SaaSAuditLog.builder()
                .brand(saved)
                .username("SUPER_ADMIN")
                .action("ARCHIVE_RESTAURANT")
                .oldValue("ACTIVE")
                .newValue("ARCHIVED")
                .module("TENANTS")
                .createdAt(LocalDateTime.now())
                .build());

        return saved;
    }

    @Transactional
    public Brand pauseSubscription(Long tenantId) {
        Brand brand = brandRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant brand not found"));
        
        brand.setStatus("SUSPENDED");
        brand.setSuspendedReason("Subscription Paused by Admin");
        Brand saved = brandRepository.save(brand);

        saasAuditLogRepository.save(com.abwcurious.restaurant.audit.SaaSAuditLog.builder()
                .brand(saved)
                .username("SUPER_ADMIN")
                .action("PAUSE_SUBSCRIPTION")
                .module("BILLING")
                .createdAt(LocalDateTime.now())
                .build());

        return saved;
    }

    @Transactional
    public Brand resumeSubscription(Long tenantId) {
        return unsuspendRestaurant(tenantId);
    }

    @Transactional
    public Brand cancelSubscription(Long tenantId) {
        Brand brand = brandRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant brand not found"));
        
        brand.setSubscriptionPlan(null);
        brand.setExpiresAt(null);
        Brand saved = brandRepository.save(brand);

        saasAuditLogRepository.save(com.abwcurious.restaurant.audit.SaaSAuditLog.builder()
                .brand(saved)
                .username("SUPER_ADMIN")
                .action("CANCEL_SUBSCRIPTION")
                .module("BILLING")
                .createdAt(LocalDateTime.now())
                .build());

        return saved;
    }

    @Transactional
    public Brand expireSubscription(Long tenantId) {
        Brand brand = brandRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant brand not found"));
        
        brand.setExpiresAt(LocalDateTime.now().minusSeconds(1));
        Brand saved = brandRepository.save(brand);

        saasAuditLogRepository.save(com.abwcurious.restaurant.audit.SaaSAuditLog.builder()
                .brand(saved)
                .username("SUPER_ADMIN")
                .action("EXPIRE_SUBSCRIPTION")
                .module("BILLING")
                .createdAt(LocalDateTime.now())
                .build());

        return saved;
    }

    @Transactional
    public Outlet createBranch(Long tenantId, String name, String code, String address, String phone, String gst, String manager, String workingHours, Integer tables, Integer kitchens, Integer printers, Integer kds, String tax) {
        Brand brand = brandRepository.findById(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Tenant brand not found"));
        
        Outlet outlet = Outlet.builder()
                .uuid(UUID.randomUUID().toString())
                .brand(brand)
                .name(name)
                .branchCode(code)
                .address(address)
                .phone(phone)
                .gstNumber(gst)
                .managerName(manager)
                .workingHours(workingHours)
                .tablesCount(tables != null ? tables : 10)
                .kitchensCount(kitchens != null ? kitchens : 1)
                .printersCount(printers != null ? printers : 1)
                .kdsCount(kds != null ? kds : 1)
                .taxDetails(tax)
                .active(true)
                .tenantId(tenantId)
                .build();
        
        return outletRepository.save(outlet);
    }

    @Transactional
    public Outlet updateBranch(Long branchId, String name, String code, String address, String phone, String gst, String manager, String workingHours, Integer tables, Integer kitchens, Integer printers, Integer kds, String tax, Boolean active) {
        Outlet outlet = outletRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found"));
        
        if (name != null) outlet.setName(name);
        if (code != null) outlet.setBranchCode(code);
        if (address != null) outlet.setAddress(address);
        if (phone != null) outlet.setPhone(phone);
        if (gst != null) outlet.setGstNumber(gst);
        if (manager != null) outlet.setManagerName(manager);
        if (workingHours != null) outlet.setWorkingHours(workingHours);
        if (tables != null) outlet.setTablesCount(tables);
        if (kitchens != null) outlet.setKitchensCount(kitchens);
        if (printers != null) outlet.setPrintersCount(printers);
        if (kds != null) outlet.setKdsCount(kds);
        if (tax != null) outlet.setTaxDetails(tax);
        if (active != null) outlet.setActive(active);
        
        return outletRepository.save(outlet);
    }

    @Transactional
    public User createUser(Long tenantId, String fullName, String username, String email, String password, String phone, String roleName, Boolean active) {
        if (userRepository.existsByUsername(username.trim().toLowerCase())) {
            throw new IllegalArgumentException("Username '" + username.trim() + "' is already in use.");
        }
        if (userRepository.existsByEmail(email.trim().toLowerCase())) {
            throw new IllegalArgumentException("Email address '" + email.trim() + "' is already in use.");
        }

        Role role = roleRepository.findByName(roleName.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleName));
        
        User user = User.builder()
                .uuid(UUID.randomUUID().toString())
                .fullName(fullName)
                .username(username.trim().toLowerCase())
                .email(email.trim().toLowerCase())
                .password(passwordEncoder.encode(password))
                .phone(phone)
                .active(active != null ? active : true)
                .tenantId(tenantId)
                .roles(new HashSet<>(Set.of(role)))
                .createdAt(LocalDateTime.now())
                .build();
        
        return userRepository.save(user);
    }
}
