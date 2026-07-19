package com.abwcurious.restaurant.feature;

import com.abwcurious.restaurant.outlet.Brand;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "feature_toggles", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "module_key"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeatureToggle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Brand brand;

    @Column(name = "module_key", nullable = false, length = 50)
    private String moduleKey;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;
}
