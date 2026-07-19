package com.abwcurious.restaurant.report;

import com.abwcurious.restaurant.order.Order;
import com.abwcurious.restaurant.order.OrderRepository;
import com.abwcurious.restaurant.order.Tax;
import com.abwcurious.restaurant.order.TaxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final OrderRepository orderRepository;
    private final TaxRepository taxRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getDailySalesSummary(Long outletId) {
        log.info("Calculating Daily Sales Summary for Outlet ID: {}", outletId);
        List<Order> orders = orderRepository.findByOutletId(outletId);

        int totalOrders = orders.size();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalDiscounts = BigDecimal.ZERO;
        BigDecimal totalTaxes = BigDecimal.ZERO;

        for (Order order : orders) {
            if ("PAID".equals(order.getStatus())) {
                totalRevenue = totalRevenue.add(order.getTotalAmount());
                totalDiscounts = totalDiscounts.add(order.getDiscountAmount());
                totalTaxes = totalTaxes.add(order.getTaxAmount());
            }
        }

        BigDecimal averageOrderValue = totalOrders > 0 
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, Object> summary = new HashMap<>();
        summary.put("outletId", outletId);
        summary.put("totalOrdersCount", totalOrders);
        summary.put("totalRevenue", totalRevenue);
        summary.put("totalDiscounts", totalDiscounts);
        summary.put("totalTaxesCollected", totalTaxes);
        summary.put("averageOrderValue", averageOrderValue);

        return summary;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getGstTaxReport(Long outletId) {
        log.info("Generating GST report for Outlet: {}", outletId);
        List<Order> orders = orderRepository.findByOutletId(outletId);

        BigDecimal cgstTotal = BigDecimal.ZERO;
        BigDecimal sgstTotal = BigDecimal.ZERO;

        for (Order order : orders) {
            if ("PAID".equals(order.getStatus())) {
                List<Tax> taxes = taxRepository.findByOrderId(order.getId());
                for (Tax tax : taxes) {
                    if ("CGST".equalsIgnoreCase(tax.getName())) {
                        cgstTotal = cgstTotal.add(tax.getAmount());
                    } else if ("SGST".equalsIgnoreCase(tax.getName())) {
                        sgstTotal = sgstTotal.add(tax.getAmount());
                    }
                }
            }
        }

        Map<String, Object> gstReport = new HashMap<>();
        gstReport.put("outletId", outletId);
        gstReport.put("cgstCollected", cgstTotal);
        gstReport.put("sgstCollected", sgstTotal);
        gstReport.put("totalGstCollected", cgstTotal.add(sgstTotal));

        return gstReport;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getOrderHistory(Long outletId) {
        log.info("Fetching order history for Outlet ID: {}", outletId);
        List<Order> orders = orderRepository.findByOutletId(outletId);
        
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (Order order : orders) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", order.getId());
            map.put("orderNumber", order.getOrderNumber());
            map.put("orderType", order.getOrderType());
            map.put("tableNumber", order.getTableNumber());
            map.put("status", order.getStatus());
            map.put("subtotal", order.getSubtotal());
            map.put("discountAmount", order.getDiscountAmount());
            map.put("taxAmount", order.getTaxAmount());
            map.put("totalAmount", order.getTotalAmount());
            map.put("createdAt", order.getCreatedAt().toString());
            if (order.getCustomer() != null) {
                map.put("customerName", order.getCustomer().getName());
                map.put("customerPhone", order.getCustomer().getPhone());
            } else {
                map.put("customerName", "Walk-in");
                map.put("customerPhone", "");
            }
            result.add(map);
        }
        return result;
    }
}
