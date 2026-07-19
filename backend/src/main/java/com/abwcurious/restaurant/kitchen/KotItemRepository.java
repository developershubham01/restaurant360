package com.abwcurious.restaurant.kitchen;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface KotItemRepository extends JpaRepository<KotItem, Long> {
    List<KotItem> findByKotTicketId(Long kotTicketId);
}
