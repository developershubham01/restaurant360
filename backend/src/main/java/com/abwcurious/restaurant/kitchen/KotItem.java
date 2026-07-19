package com.abwcurious.restaurant.kitchen;

import com.abwcurious.restaurant.order.OrderItem;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "kot_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KotItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kot_ticket_id", nullable = false)
    private KotTicket kotTicket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING"; // PENDING, PREPARING, READY, SERVED

    private String notes;
}
