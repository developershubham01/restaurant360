package com.abwcurious.restaurant.inventory;

import com.abwcurious.restaurant.outlet.Outlet;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "stock_transfers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockTransfer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_outlet_id", nullable = false)
    private Outlet fromOutlet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_outlet_id", nullable = false)
    private Outlet toOutlet;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING"; // PENDING, COMPLETED, REJECTED

    @Column(name = "created_at", nullable = false, updatable = false)
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
