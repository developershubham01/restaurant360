package com.abwcurious.restaurant.kitchen;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KotTicketResponseDto {
    private Long id;
    private String ticketNumber;
    private String orderNumber;
    private String tableName;
    private String orderType;
    private String status;
    private LocalDateTime createdAt;
    private long timeElapsed; // in minutes
    private List<KotItemResponseDto> items;

    public static KotTicketResponseDto fromEntity(KotTicket ticket) {
        long minutes = 0;
        if (ticket.getCreatedAt() != null) {
            minutes = Duration.between(ticket.getCreatedAt(), LocalDateTime.now()).toMinutes();
        }

        String table = "Takeaway";
        if (ticket.getOrder() != null) {
            if (ticket.getOrder().getTableNumber() != null && !ticket.getOrder().getTableNumber().isEmpty()) {
                table = ticket.getOrder().getTableNumber();
            } else {
                table = ticket.getOrder().getOrderType();
            }
        }

        return KotTicketResponseDto.builder()
                .id(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .orderNumber(ticket.getOrder() != null ? ticket.getOrder().getOrderNumber() : "")
                .tableName(table)
                .orderType(ticket.getOrder() != null ? ticket.getOrder().getOrderType() : "Dine-in")
                .status(ticket.getStatus())
                .createdAt(ticket.getCreatedAt())
                .timeElapsed(minutes)
                .items(ticket.getItems() != null ? ticket.getItems().stream()
                        .map(KotItemResponseDto::fromEntity)
                        .collect(Collectors.toList()) : List.of())
                .build();
    }
}
