package com.abwcurious.restaurant.crm;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LoyaltyWalletRepository extends JpaRepository<LoyaltyWallet, Long> {
    Optional<LoyaltyWallet> findByCustomerId(Long customerId);
}
