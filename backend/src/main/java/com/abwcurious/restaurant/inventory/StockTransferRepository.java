package com.abwcurious.restaurant.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface StockTransferRepository extends JpaRepository<StockTransfer, Long> {
    Optional<StockTransfer> findByUuid(String uuid);
    List<StockTransfer> findByFromOutletIdOrToOutletId(Long fromOutletId, Long toOutletId);
}
