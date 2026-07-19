package com.abwcurious.restaurant.table;

import java.time.format.DateTimeFormatter;

public class TableResponseDto {
    public String id;
    public int seats;
    public String status;
    public String mergedIntoId;
    public Long floorId;
    public String floorName;
    public Long activeOrderId;
    public String waiterName;
    public String customerName;
    public String customerPhone;
    public String reservationTime;

    public static TableResponseDto from(DiningTable table) {
        TableResponseDto dto = new TableResponseDto();
        dto.id = table.getId();
        dto.seats = table.getSeats();
        dto.status = table.getStatus();
        dto.mergedIntoId = table.getMergedInto() != null ? table.getMergedInto().getId() : null;
        if (table.getFloor() != null) {
            dto.floorId = table.getFloor().getId();
            dto.floorName = table.getFloor().getName();
        }
        dto.activeOrderId = table.getActiveOrderId();
        dto.waiterName = table.getWaiterName();
        dto.customerName = table.getCustomerName();
        dto.customerPhone = table.getCustomerPhone();
        if (table.getReservationTime() != null) {
            dto.reservationTime = table.getReservationTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        }
        return dto;
    }
}
