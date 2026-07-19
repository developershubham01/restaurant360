package com.abwcurious.restaurant.report;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "integration_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntegrationLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "provider_name", nullable = false, length = 100)
    private String providerName;

    @Column(nullable = false, length = 20)
    private String direction; // INBOUND, OUTBOUND

    @Column(columnDefinition = "text")
    private String payload;

    @Column(nullable = false, length = 20)
    private String status; // SUCCESS, FAILED, RETRYING

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
