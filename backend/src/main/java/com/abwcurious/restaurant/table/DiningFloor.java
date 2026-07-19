package com.abwcurious.restaurant.table;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "dining_floors")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiningFloor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @PrePersist
    protected void onCreate() {
        if (tenantId == null) {
            tenantId = com.abwcurious.restaurant.tenant.TenantContext.getCurrentTenant();
        }
    }
}
