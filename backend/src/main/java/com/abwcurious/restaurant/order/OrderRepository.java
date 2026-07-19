package com.abwcurious.restaurant.order;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByUuid(String uuid);
    Optional<Order> findByOrderNumber(String orderNumber);
    List<Order> findByOutletId(Long outletId);
    List<Order> findByShiftId(Long shiftId);
}
