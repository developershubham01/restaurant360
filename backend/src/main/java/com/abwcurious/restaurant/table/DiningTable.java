package com.abwcurious.restaurant.table;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dining_tables")
public class DiningTable {

    @Id
    @Column(length = 50)
    private String id;

    @Column(nullable = false)
    private int seats = 4;

    @Column(nullable = false, length = 30)
    private String status = "Available"; // Available, Occupied, Reserved, Billing, Cleaning, OutOfService

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merged_into")
    private DiningTable mergedInto;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "floor_id", nullable = false)
    private DiningFloor floor;

    @Column(name = "active_order_id")
    private Long activeOrderId;

    @Column(name = "waiter_name", length = 100)
    private String waiterName;

    @Column(name = "customer_name", length = 100)
    private String customerName;

    @Column(name = "customer_phone", length = 20)
    private String customerPhone;

    @Column(name = "reservation_time")
    private LocalDateTime reservationTime;

    public DiningTable() {}

    public DiningTable(String id, int seats, String status, DiningFloor floor) {
        this.id = id;
        this.seats = seats;
        this.status = status;
        this.floor = floor;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public int getSeats() { return seats; }
    public void setSeats(int seats) { this.seats = seats; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public DiningTable getMergedInto() { return mergedInto; }
    public void setMergedInto(DiningTable mergedInto) { this.mergedInto = mergedInto; }

    public DiningFloor getFloor() { return floor; }
    public void setFloor(DiningFloor floor) { this.floor = floor; }

    public Long getActiveOrderId() { return activeOrderId; }
    public void setActiveOrderId(Long activeOrderId) { this.activeOrderId = activeOrderId; }

    public String getWaiterName() { return waiterName; }
    public void setWaiterName(String waiterName) { this.waiterName = waiterName; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public LocalDateTime getReservationTime() { return reservationTime; }
    public void setReservationTime(LocalDateTime reservationTime) { this.reservationTime = reservationTime; }

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }

    @PrePersist
    protected void onCreate() {
        if (tenantId == null) {
            tenantId = com.abwcurious.restaurant.tenant.TenantContext.getCurrentTenant();
        }
    }
}
