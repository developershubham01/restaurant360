package com.abwcurious.restaurant.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface StockLedgerRepository extends JpaRepository<StockLedger, Long> {
    Optional<StockLedger> findByUuid(String uuid);
    List<StockLedger> findByOutletId(Long outletId);
    List<StockLedger> findByOutletIdAndIngredientId(Long outletId, Long ingredientId);
}
