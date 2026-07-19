package com.abwcurious.restaurant.crm;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByUuid(String uuid);
    Optional<Coupon> findByCodeAndActiveTrue(String code);
}
