package com.abwcurious.restaurant.kitchen;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface KotTicketRepository extends JpaRepository<KotTicket, Long> {
    Optional<KotTicket> findByUuid(String uuid);
    List<KotTicket> findByOutletId(Long outletId);
    List<KotTicket> findByOrderId(Long orderId);
    List<KotTicket> findByOutletIdAndStatusNot(Long outletId, String status);
}
