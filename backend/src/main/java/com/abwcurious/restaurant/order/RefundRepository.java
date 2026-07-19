package com.abwcurious.restaurant.order;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface RefundRepository extends JpaRepository<Refund, Long> {
    Optional<Refund> findByUuid(String uuid);
    List<Refund> findByPaymentId(Long paymentId);
}
