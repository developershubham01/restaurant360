package com.abwcurious.restaurant.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Lightweight DTO for Order API responses.
 * Avoids Jackson infinite circular reference caused by bidirectional JPA relationships.
 */
public class OrderResponseDto {

    public Long id;
    public String uuid;
    public String orderNumber;
    public String orderType;
    public String tableNumber;
    public String status;
    public BigDecimal subtotal;
    public BigDecimal discountAmount;
    public BigDecimal taxAmount;
    public BigDecimal roundOff;
    public BigDecimal totalAmount;
    public LocalDateTime createdAt;
    public List<OrderItemDto> items;

    // Nested item DTO
    public static class OrderItemDto {
        public Long id;
        public String name;
        public Integer quantity;
        public BigDecimal price;
        public BigDecimal subtotal;
        public BigDecimal taxAmount;
        public BigDecimal totalAmount;
    }

    /** Static factory — converts a saved Order entity to a safe DTO */
    public static OrderResponseDto from(Order order) {
        OrderResponseDto dto = new OrderResponseDto();
        dto.id            = order.getId();
        dto.uuid          = order.getUuid();
        dto.orderNumber   = order.getOrderNumber();
        dto.orderType     = order.getOrderType();
        dto.tableNumber   = order.getTableNumber();
        dto.status        = order.getStatus();
        dto.subtotal      = order.getSubtotal();
        dto.discountAmount = order.getDiscountAmount();
        dto.taxAmount     = order.getTaxAmount();
        dto.roundOff      = order.getRoundOff();
        dto.totalAmount   = order.getTotalAmount();
        dto.createdAt     = order.getCreatedAt();

        if (order.getItems() != null) {
            dto.items = order.getItems().stream().map(item -> {
                OrderItemDto itemDto = new OrderItemDto();
                itemDto.id          = item.getId();
                itemDto.name        = item.getName();
                itemDto.quantity    = item.getQuantity();
                itemDto.price       = item.getPrice();
                itemDto.subtotal    = item.getSubtotal();
                itemDto.taxAmount   = item.getTaxAmount();
                itemDto.totalAmount = item.getTotalAmount();
                return itemDto;
            }).collect(Collectors.toList());
        }
        return dto;
    }
}
