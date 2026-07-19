package com.abwcurious.restaurant.order;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DiscountRepository extends JpaRepository<Discount, Long> {
    List<Discount> findByOrderId(Long orderId);
}
