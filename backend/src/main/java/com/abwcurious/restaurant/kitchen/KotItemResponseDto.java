package com.abwcurious.restaurant.kitchen;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KotItemResponseDto {
    private Long id;
    private String name;
    private Integer quantity;
    private String status;
    private String notes;

    public static KotItemResponseDto fromEntity(KotItem item) {
        return KotItemResponseDto.builder()
                .id(item.getId())
                .name(item.getOrderItem() != null && item.getOrderItem().getMenuItem() != null ? item.getOrderItem().getMenuItem().getName() : "Unknown Item")
                .quantity(item.getQuantity())
                .status(item.getStatus())
                .notes(item.getNotes())
                .build();
    }
}
