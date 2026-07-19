package com.abwcurious.restaurant.report;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface ReportSnapshotRepository extends JpaRepository<ReportSnapshot, Long> {
    Optional<ReportSnapshot> findByUuid(String uuid);
    List<ReportSnapshot> findByOutletId(Long outletId);
}
