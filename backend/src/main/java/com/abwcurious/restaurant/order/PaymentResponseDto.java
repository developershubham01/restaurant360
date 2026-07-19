package com.abwcurious.restaurant.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Lightweight DTO for Payment API responses.
 * Avoids Jackson infinite circular reference via Payment → Order → Payment chain.
 */
public class PaymentResponseDto {

    public Long id;
    public String uuid;
    public BigDecimal amount;
    public String paymentMethod;
    public String status;
    public String transactionReference;
    public LocalDateTime createdAt;

    // Minimal order info embedded
    public Long orderId;
    public String orderNumber;
    public String orderStatus;
    public BigDecimal orderTotal;

    public static PaymentResponseDto from(Payment payment) {
        PaymentResponseDto dto = new PaymentResponseDto();
        dto.id                   = payment.getId();
        dto.uuid                 = payment.getUuid();
        dto.amount               = payment.getAmount();
        dto.paymentMethod        = payment.getPaymentMethod();
        dto.status               = payment.getStatus();
        dto.transactionReference = payment.getTransactionReference();
        dto.createdAt            = payment.getCreatedAt();

        if (payment.getOrder() != null) {
            dto.orderId     = payment.getOrder().getId();
            dto.orderNumber = payment.getOrder().getOrderNumber();
            dto.orderStatus = payment.getOrder().getStatus();
            dto.orderTotal  = payment.getOrder().getTotalAmount();
        }
        return dto;
    }
}
