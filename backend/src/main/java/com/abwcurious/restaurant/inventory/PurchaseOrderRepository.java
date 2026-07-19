package com.abwcurious.restaurant.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    Optional<PurchaseOrder> findByUuid(String uuid);
    Optional<PurchaseOrder> findByPoNumber(String poNumber);
    List<PurchaseOrder> findByOutletId(Long outletId);
}
