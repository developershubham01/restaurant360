package com.abwcurious.restaurant.security;

import com.abwcurious.restaurant.outlet.Brand;
import com.abwcurious.restaurant.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "device_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "device_token", nullable = false, unique = true, length = 255)
    private String deviceToken;

    @Column(name = "device_name", length = 255)
    private String deviceName;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "last_accessed", nullable = false)
    @Builder.Default
    private LocalDateTime lastAccessed = LocalDateTime.now();
}
