package com.abwcurious.restaurant.outlet;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "outlets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Outlet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @Column(nullable = false, length = 100)
    private String name;

    private String address;

    @Column(length = 20)
    private String phone;

    @Column(name = "gst_number", length = 20)
    private String gstNumber;

    @Column(name = "fssai_number", length = 20)
    private String fssaiNumber;

    @Column(name = "cgst_rate")
    @Builder.Default
    private Double cgstRate = 2.5;

    @Column(name = "sgst_rate")
    @Builder.Default
    private Double sgstRate = 2.5;

    @Column(name = "service_charge_rate")
    @Builder.Default
    private Double serviceChargeRate = 0.0;

    @Column(name = "packaging_charge")
    @Builder.Default
    private Double packagingCharge = 15.0;

    @Column(name = "branch_code", length = 50)
    private String branchCode;

    @Column(name = "manager_name", length = 100)
    private String managerName;

    @Column(name = "working_hours", length = 100)
    private String workingHours;

    @Column(name = "tables_count")
    @Builder.Default
    private Integer tablesCount = 10;

    @Column(name = "kitchens_count")
    @Builder.Default
    private Integer kitchensCount = 1;

    @Column(name = "printers_count")
    @Builder.Default
    private Integer printersCount = 1;

    @Column(name = "kds_count")
    @Builder.Default
    private Integer kdsCount = 1;

    @Column(name = "tax_details", length = 255)
    private String taxDetails;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @PrePersist
    protected void onCreate() {
        if (uuid == null) {
            uuid = UUID.randomUUID().toString();
        }
    }
}
