package com.abwcurious.restaurant.audit;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "impersonation_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImpersonationLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "impersonator_username", nullable = false, length = 100)
    private String impersonatorUsername;

    @Column(name = "impersonated_username", nullable = false, length = 100)
    private String impersonatedUsername;

    @Column(name = "impersonated_at", nullable = false)
    @Builder.Default
    private LocalDateTime impersonatedAt = LocalDateTime.now();

    @Column(name = "ip_address", length = 45)
    private String ipAddress;
}
