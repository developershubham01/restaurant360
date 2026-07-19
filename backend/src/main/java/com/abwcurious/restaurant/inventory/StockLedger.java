package com.abwcurious.restaurant.inventory;
import com.abwcurious.restaurant.outlet.Outlet;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "stock_ledger")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockLedger {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 36)
    private String uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outlet_id", nullable = false)
    private Outlet outlet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(name = "transaction_type", nullable = false, length = 50)
    private String transactionType; // PURCHASE, SALE_DEDUCTION, WASTAGE, TRANSFER_IN, TRANSFER_OUT, MANUAL_ADJUST

    @Column(nullable = false)
    private BigDecimal quantity; // Positive for incoming, negative for outgoing

    @Column(name = "unit_price")
    private BigDecimal unitPrice;

    @Column(name = "reference_id")
    private Long referenceId;
    private String notes;

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
