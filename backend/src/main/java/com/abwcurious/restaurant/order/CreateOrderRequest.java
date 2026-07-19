package com.abwcurious.restaurant.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class CreateOrderRequest {
    @NotNull(message = "Outlet ID is required")
    private Long outletId;

    @NotNull(message = "Terminal ID is required")
    private Long terminalId;

    @NotNull(message = "Shift ID is required")
    private Long shiftId;

    @NotNull(message = "User ID is required")
    private Long userId;

    private String customerPhone;

    private String couponCode;

    @NotBlank(message = "Order type is required")
    private String orderType; // DINE_IN, TAKEAWAY, DELIVERY

    private String tableNumber;

    @NotEmpty(message = "Order must contain at least one item")
    private List<OrderItemRequest> items;

    @Data
    public static class OrderItemRequest {
        @NotNull(message = "Menu Item ID is required")
        private Long menuItemId;

        private Long variantId;

        @NotNull(message = "Quantity is required")
        private Integer quantity;

        private String notes;
    }
}
