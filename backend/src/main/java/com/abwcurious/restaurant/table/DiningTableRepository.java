package com.abwcurious.restaurant.table;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiningTableRepository extends JpaRepository<DiningTable, String> {
    List<DiningTable> findByFloorId(Long floorId);
    List<DiningTable> findByMergedIntoId(String parentId);
}
