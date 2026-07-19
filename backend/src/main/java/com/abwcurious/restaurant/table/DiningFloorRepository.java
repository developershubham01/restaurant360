package com.abwcurious.restaurant.table;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiningFloorRepository extends JpaRepository<DiningFloor, Long> {
    List<DiningFloor> findByActiveTrue();
}
