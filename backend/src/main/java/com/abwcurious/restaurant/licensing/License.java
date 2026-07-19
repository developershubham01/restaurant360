package com.abwcurious.restaurant.licensing;

import com.abwcurious.restaurant.outlet.Brand;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "licenses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class License {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Brand brand;

    @Column(name = "license_key", nullable = false, unique = true)
    private String licenseKey;

    @Column(nullable = false, length = 20)
    private String type; // CLOUD, OFFLINE, DESKTOP

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, DEACTIVATED, EXPIRED

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
}
