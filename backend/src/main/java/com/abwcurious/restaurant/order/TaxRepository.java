package com.abwcurious.restaurant.order;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaxRepository extends JpaRepository<Tax, Long> {
    List<Tax> findByOrderId(Long orderId);
}
