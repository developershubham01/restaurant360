package com.abwcurious.restaurant.audit;

import com.abwcurious.restaurant.outlet.Brand;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "login_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Brand brand;

    @Column(nullable = false, length = 100)
    private String username;

    @Column(name = "login_time", nullable = false)
    @Builder.Default
    private LocalDateTime loginTime = LocalDateTime.now();

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "device_details", length = 255)
    private String deviceDetails;

    @Column(nullable = false, length = 20)
    private String status; // SUCCESS, FAILED
}
