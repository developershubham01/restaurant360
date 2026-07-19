package com.abwcurious.restaurant.order;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByUuid(String uuid);
    List<Payment> findByOrderId(Long orderId);
    List<Payment> findByOutletId(Long outletId);
}
