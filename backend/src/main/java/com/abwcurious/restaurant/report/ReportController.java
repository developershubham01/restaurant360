package com.abwcurious.restaurant.report;

import com.abwcurious.restaurant.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/sales-summary")
    public ApiResponse<Map<String, Object>> getSalesSummary(@RequestParam Long outletId) {
        Map<String, Object> summary = reportService.getDailySalesSummary(outletId);
        return ApiResponse.success(summary);
    }

    @GetMapping("/gst-report")
    public ApiResponse<Map<String, Object>> getGstReport(@RequestParam Long outletId) {
        Map<String, Object> gstReport = reportService.getGstTaxReport(outletId);
        return ApiResponse.success(gstReport);
    }

    @GetMapping("/order-history")
    public ApiResponse<java.util.List<Map<String, Object>>> getOrderHistory(@RequestParam Long outletId) {
        java.util.List<Map<String, Object>> history = reportService.getOrderHistory(outletId);
        return ApiResponse.success(history);
    }
}
