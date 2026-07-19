package com.abwcurious.restaurant.outlet;

import com.abwcurious.restaurant.subscription.SubscriptionPlan;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "brands")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Brand {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @Column(nullable = false, length = 100)
    private String name;

    private String description;

    @Column(name = "owner_name")
    private String ownerName;

    @Column(name = "owner_email", unique = true)
    private String ownerEmail;

    @Column(name = "owner_mobile")
    private String ownerMobile;

    @Column(name = "gst_number")
    private String gstNumber;

    @Column(name = "pan_number", length = 20)
    private String panNumber;

    private String address;
    
    private String city;
    
    private String state;
    
    private String country;

    @Column(name = "pin_code", length = 20)
    private String pinCode;

    @Column(name = "max_users_allowed")
    private Integer maxUsersAllowed;

    @Column(name = "max_branches_allowed")
    private Integer maxBranchesAllowed;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subscription_plan_id")
    private SubscriptionPlan subscriptionPlan;

    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, SUSPENDED

    @Column(name = "trial_expires_at")
    private LocalDateTime trialExpiresAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(length = 10)
    @Builder.Default
    private String currency = "INR";

    @Column(length = 50)
    @Builder.Default
    private String timezone = "Asia/Kolkata";

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(nullable = false)
    @Builder.Default
    private boolean locked = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean archived = false;

    @Column(name = "suspended_at")
    private LocalDateTime suspendedAt;

    @Column(name = "suspended_reason")
    private String suspendedReason;

    @Column(name = "storage_used_mb", nullable = false)
    @Builder.Default
    private java.math.BigDecimal storageUsedMb = java.math.BigDecimal.ZERO;

    @Column(name = "last_activity_at")
    private LocalDateTime lastActivityAt;

    @Column(name = "sla_status", length = 20)
    @Builder.Default
    private String slaStatus = "PENDING";

    @Column(name = "sla_url")
    private String slaUrl;

    @Column(name = "nda_status", length = 20)
    @Builder.Default
    private String ndaStatus = "PENDING";

    @Column(name = "nda_url")
    private String ndaUrl;

    @Column(name = "license_agreement_status", length = 20)
    @Builder.Default
    private String licenseAgreementStatus = "PENDING";

    @Column(name = "license_agreement_url")
    private String licenseAgreementUrl;

    @Column(name = "gst_cert_status", length = 20)
    @Builder.Default
    private String gstCertStatus = "PENDING";

    @Column(name = "gst_cert_url")
    private String gstCertUrl;

    @Column(name = "pan_aadhar_status", length = 20)
    @Builder.Default
    private String panAadharStatus = "PENDING";

    @Column(name = "pan_aadhar_url")
    private String panAadharUrl;

    @Column(name = "fssai_cert_status", length = 20)
    @Builder.Default
    private String fssaiCertStatus = "PENDING";

    @Column(name = "fssai_cert_url")
    private String fssaiCertUrl;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (uuid == null) {
            uuid = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
