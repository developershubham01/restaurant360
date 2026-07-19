package com.abwcurious.restaurant.subscription;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscription_plans")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(name = "max_users", nullable = false)
    private Integer maxUsers;

    @Column(name = "max_branches", nullable = false)
    private Integer maxBranches;

    @Column(name = "max_products", nullable = false)
    private Integer maxProducts;

    @Column(name = "max_tables", nullable = false)
    private Integer maxTables;

    @Column(name = "max_kitchens", nullable = false)
    private Integer maxKitchens;

    @Column(name = "max_printers", nullable = false)
    private Integer maxPrinters;

    @Column(name = "storage_limit_gb", nullable = false)
    private BigDecimal storageLimitGb;

    @Column(name = "monthly_price", nullable = false)
    private BigDecimal monthlyPrice;

    @Column(name = "yearly_price", nullable = false)
    private BigDecimal yearlyPrice;

    @Column(name = "trial_days", nullable = false)
    private Integer trialDays;

    @Column(name = "features_json")
    private String featuresJson;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
