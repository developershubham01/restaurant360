package com.abwcurious.restaurant.saas;

import com.abwcurious.restaurant.outlet.Brand;
import com.abwcurious.restaurant.outlet.BrandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SubscriptionAlertService {

    private final BrandRepository brandRepository;

    public Map<String, Object> getSubscriptionAlerts() {
        List<Brand> brands = brandRepository.findAllByArchivedFalse();
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();

        List<Brand> expiringToday = new ArrayList<>();
        List<Brand> expiring3Days = new ArrayList<>();
        List<Brand> expiring7Days = new ArrayList<>();
        List<Brand> expired = new ArrayList<>();
        List<Brand> suspended = new ArrayList<>();
        List<Brand> trial = new ArrayList<>();
        List<Brand> renewedToday = new ArrayList<>();

        for (Brand brand : brands) {
            // Suspended check
            if ("SUSPENDED".equalsIgnoreCase(brand.getStatus())) {
                suspended.add(brand);
            }

            // Expiry/Trial calculations
            LocalDateTime expiresAt = brand.getExpiresAt();
            LocalDateTime trialExpires = brand.getTrialExpiresAt();

            if (expiresAt != null) {
                LocalDate expiryDate = expiresAt.toLocalDate();
                long daysUntilExpiry = ChronoUnit.DAYS.between(today, expiryDate);

                if (expiresAt.isBefore(now)) {
                    expired.add(brand);
                } else if (daysUntilExpiry == 0) {
                    expiringToday.add(brand);
                } else if (daysUntilExpiry > 0 && daysUntilExpiry <= 3) {
                    expiring3Days.add(brand);
                } else if (daysUntilExpiry > 0 && daysUntilExpiry <= 7) {
                    expiring7Days.add(brand);
                }
            } else if (trialExpires != null && trialExpires.isAfter(now)) {
                trial.add(brand);
            }

            // Renewed today: Check if trial or regular subscription was created/updated within 24 hours
            if (brand.getCreatedAt() != null && ChronoUnit.HOURS.between(brand.getCreatedAt(), now) <= 24) {
                renewedToday.add(brand);
            }
        }

        Map<String, Object> alerts = new HashMap<>();
        alerts.put("expiringToday", expiringToday);
        alerts.put("expiring3Days", expiring3Days);
        alerts.put("expiring7Days", expiring7Days);
        alerts.put("expired", expired);
        alerts.put("suspended", suspended);
        alerts.put("trial", trial);
        alerts.put("renewedToday", renewedToday);

        // Put integer counts for badge consumption
        alerts.put("expiringTodayCount", expiringToday.size());
        alerts.put("expiring3DaysCount", expiring3Days.size());
        alerts.put("expiring7DaysCount", expiring7Days.size());
        alerts.put("expiredCount", expired.size());
        alerts.put("suspendedCount", suspended.size());
        alerts.put("trialCount", trial.size());
        alerts.put("renewedTodayCount", renewedToday.size());

        return alerts;
    }
}
