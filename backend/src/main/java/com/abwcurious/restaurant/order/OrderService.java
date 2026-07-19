package com.abwcurious.restaurant.order;

import com.abwcurious.restaurant.crm.*;
import com.abwcurious.restaurant.inventory.InventoryService;
import com.abwcurious.restaurant.kitchen.KitchenService;
import com.abwcurious.restaurant.menu.*;
import com.abwcurious.restaurant.outlet.*;
import com.abwcurious.restaurant.table.DiningTable;
import com.abwcurious.restaurant.table.DiningTableRepository;
import com.abwcurious.restaurant.user.User;
import com.abwcurious.restaurant.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OutletRepository outletRepository;
    private final TerminalRepository terminalRepository;
    private final ShiftRepository shiftRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final LoyaltyWalletRepository loyaltyWalletRepository;
    private final CouponRepository couponRepository;
    private final MenuItemRepository menuItemRepository;
    private final VariantRepository variantRepository;
    private final PaymentRepository paymentRepository;
    private final DiningTableRepository diningTableRepository;
    
    private final KitchenService kitchenService;
    private final InventoryService inventoryService;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            OutletRepository outletRepository,
            TerminalRepository terminalRepository,
            ShiftRepository shiftRepository,
            UserRepository userRepository,
            CustomerRepository customerRepository,
            LoyaltyWalletRepository loyaltyWalletRepository,
            CouponRepository couponRepository,
            MenuItemRepository menuItemRepository,
            VariantRepository variantRepository,
            PaymentRepository paymentRepository,
            DiningTableRepository diningTableRepository,
            KitchenService kitchenService,
            InventoryService inventoryService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.outletRepository = outletRepository;
        this.terminalRepository = terminalRepository;
        this.shiftRepository = shiftRepository;
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.loyaltyWalletRepository = loyaltyWalletRepository;
        this.couponRepository = couponRepository;
        this.menuItemRepository = menuItemRepository;
        this.variantRepository = variantRepository;
        this.paymentRepository = paymentRepository;
        this.diningTableRepository = diningTableRepository;
        this.kitchenService = kitchenService;
        this.inventoryService = inventoryService;
    }

    @Transactional
    public Order createOrder(CreateOrderRequest request) {
        log.info("Creating order for Outlet: {}, Terminal: {}", request.getOutletId(), request.getTerminalId());

        Outlet outlet = outletRepository.findById(request.getOutletId())
                .orElseThrow(() -> new IllegalArgumentException("Outlet not found"));
        Terminal terminal = terminalRepository.findById(request.getTerminalId())
                .orElseThrow(() -> new IllegalArgumentException("Terminal not found"));
        Shift shift = shiftRepository.findById(request.getShiftId())
                .orElseThrow(() -> new IllegalArgumentException("Shift not found"));
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!shift.getStatus().equals("OPEN")) {
            throw new IllegalStateException("Cannot create order in a closed shift");
        }

        // ERP Occupancy Check
        if ("Dine-in".equalsIgnoreCase(request.getOrderType()) && request.getTableNumber() != null && !request.getTableNumber().trim().isEmpty()) {
            String tableId = request.getTableNumber().trim();
            Optional<DiningTable> tableOpt = diningTableRepository.findById(tableId);
            if (tableOpt.isPresent()) {
                DiningTable table = tableOpt.get();
                if ("Occupied".equalsIgnoreCase(table.getStatus()) || "Billing".equalsIgnoreCase(table.getStatus())) {
                    throw new IllegalStateException("Table " + tableId + " is already occupied!");
                }
                table.setStatus("Occupied");
                diningTableRepository.save(table);
            }
        }

        Customer customer = null;
        if (request.getCustomerPhone() != null && !request.getCustomerPhone().isBlank()) {
            customer = customerRepository.findByPhone(request.getCustomerPhone()).orElse(null);
        }

        // Generate Order Number
        long count = orderRepository.count() + 1;
        String orderNumber = "ORD-" + shift.getId() + "-" + String.format("%05d", count);

        Order order = Order.builder()
                .uuid(UUID.randomUUID().toString())
                .outlet(outlet)
                .terminal(terminal)
                .shift(shift)
                .user(user)
                .customer(customer)
                .orderNumber(orderNumber)
                .orderType(request.getOrderType())
                .tableNumber(request.getTableNumber())
                .status("PENDING")
                .build();

        // 1. Calculate Items & Subtotal
        BigDecimal subtotal = BigDecimal.ZERO;
        Set<OrderItem> orderItems = new HashSet<>();

        for (CreateOrderRequest.OrderItemRequest itemReq : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Menu item not found: " + itemReq.getMenuItemId()));

            BigDecimal itemPrice = menuItem.getBasePrice();
            Variant variant = null;

            if (itemReq.getVariantId() != null) {
                variant = variantRepository.findById(itemReq.getVariantId())
                        .orElseThrow(() -> new IllegalArgumentException("Variant not found: " + itemReq.getVariantId()));
                itemPrice = variant.getPriceOverride();
            }

            BigDecimal itemSubtotal = itemPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(itemSubtotal);

            OrderItem orderItem = OrderItem.builder()
                    .uuid(UUID.randomUUID().toString())
                    .order(order)
                    .menuItem(menuItem)
                    .variant(variant)
                    .name(menuItem.getName() + (variant != null ? " (" + variant.getName() + ")" : ""))
                    .quantity(itemReq.getQuantity())
                    .price(itemPrice)
                    .subtotal(itemSubtotal)
                    .totalAmount(itemSubtotal) // Will adjust after discounts and taxes
                    .build();

            orderItems.add(orderItem);
        }

        order.setSubtotal(subtotal);
        order.setItems(orderItems);

        // 2. Process Discounts (Coupon)
        BigDecimal totalDiscount = BigDecimal.ZERO;
        Coupon coupon = null;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            coupon = couponRepository.findByCodeAndActiveTrue(request.getCouponCode()).orElse(null);
            if (coupon != null && subtotal.compareTo(coupon.getMinOrderAmount()) >= 0) {
                LocalDateTime now = LocalDateTime.now();
                if (now.isAfter(coupon.getStartDate()) && now.isBefore(coupon.getEndDate())) {
                    if (coupon.getDiscountType().equals("FLAT")) {
                        totalDiscount = coupon.getDiscountValue();
                    } else if (coupon.getDiscountType().equals("PERCENTAGE")) {
                        totalDiscount = subtotal.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                        if (coupon.getMaxDiscount() != null && totalDiscount.compareTo(coupon.getMaxDiscount()) > 0) {
                            totalDiscount = coupon.getMaxDiscount();
                        }
                    }
                    // Apply discount details
                    Discount discount = Discount.builder()
                            .order(order)
                            .coupon(coupon)
                            .type(coupon.getDiscountType())
                            .discountValue(coupon.getDiscountValue())
                            .amount(totalDiscount)
                            .reason("Coupon applied: " + coupon.getCode())
                            .build();
                    order.getDiscounts().add(discount);
                }
            }
        }
        order.setDiscountAmount(totalDiscount);

        // Apply discount proportionally to items
        BigDecimal finalDiscount = totalDiscount;
        BigDecimal finalSubtotal = subtotal;

        // 3. Process Taxes (normalized CGST & SGST)
        BigDecimal totalTax = BigDecimal.ZERO;
        for (OrderItem item : order.getItems()) {
            BigDecimal proportionalDiscount = BigDecimal.ZERO;
            if (finalDiscount.compareTo(BigDecimal.ZERO) > 0 && finalSubtotal.compareTo(BigDecimal.ZERO) > 0) {
                proportionalDiscount = finalDiscount.multiply(item.getSubtotal())
                        .divide(finalSubtotal, 2, RoundingMode.HALF_UP);
            }
            item.setDiscountAmount(proportionalDiscount);

            BigDecimal taxableAmount = item.getSubtotal().subtract(proportionalDiscount);
            BigDecimal taxRate = item.getMenuItem().getTaxRate();
            BigDecimal itemTax = taxableAmount.multiply(taxRate)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            item.setTaxAmount(itemTax);
            item.setTotalAmount(taxableAmount.add(itemTax));
            totalTax = totalTax.add(itemTax);

            // Record taxes (split CGST 50% and SGST 50%)
            BigDecimal cgstRate = taxRate.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
            BigDecimal sgstRate = cgstRate;

            BigDecimal cgstAmount = itemTax.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
            BigDecimal sgstAmount = itemTax.subtract(cgstAmount); // Ensure no rounding pennies lost

            Tax cgst = Tax.builder()
                    .order(order)
                    .orderItem(item)
                    .name("CGST")
                    .rate(cgstRate)
                    .amount(cgstAmount)
                    .build();

            Tax sgst = Tax.builder()
                    .order(order)
                    .orderItem(item)
                    .name("SGST")
                    .rate(sgstRate)
                    .amount(sgstAmount)
                    .build();

            order.getTaxes().add(cgst);
            order.getTaxes().add(sgst);
        }

        order.setTaxAmount(totalTax);

        // 4. Calculate Net Total & Rounding
        BigDecimal rawTotal = subtotal.subtract(totalDiscount).add(totalTax);
        BigDecimal roundedTotal = rawTotal.setScale(0, RoundingMode.HALF_UP);
        BigDecimal roundOff = roundedTotal.subtract(rawTotal);

        order.setRoundOff(roundOff);
        order.setTotalAmount(roundedTotal);

        Order savedOrder = orderRepository.save(order);
        orderItemRepository.saveAll(orderItems);

        // Update table activeOrderId
        if ("Dine-in".equalsIgnoreCase(savedOrder.getOrderType()) && savedOrder.getTableNumber() != null) {
            Optional<DiningTable> tableOpt = diningTableRepository.findById(savedOrder.getTableNumber().trim());
            if (tableOpt.isPresent()) {
                DiningTable table = tableOpt.get();
                table.setActiveOrderId(savedOrder.getId());
                diningTableRepository.save(table);
            }
        }

        // Trigger Kitchen Order Ticket (KOT)
        kitchenService.createKot(savedOrder);

        return savedOrder;
    }

    @Transactional
    public Payment processPayment(Long orderId, String method, String txnRef) {
        log.info("Processing payment for Order ID: {} via {}", orderId, method);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getStatus().equals("PAID")) {
            throw new IllegalStateException("Order is already paid");
        }

        Payment payment = Payment.builder()
                .uuid(UUID.randomUUID().toString())
                .outlet(order.getOutlet())
                .order(order)
                .amount(order.getTotalAmount())
                .paymentMethod(method)
                .status("COMPLETED")
                .transactionReference(txnRef)
                .createdAt(LocalDateTime.now())
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        order.setStatus("PAID");
        orderRepository.save(order);

        // Release Dining Table & children tables
        if ("Dine-in".equalsIgnoreCase(order.getOrderType()) && order.getTableNumber() != null) {
            Optional<DiningTable> tableOpt = diningTableRepository.findById(order.getTableNumber().trim());
            if (tableOpt.isPresent()) {
                DiningTable table = tableOpt.get();
                table.setStatus("Available");
                table.setActiveOrderId(null);
                table.setWaiterName(null);
                table.setCustomerName(null);
                table.setCustomerPhone(null);
                table.setReservationTime(null);
                diningTableRepository.save(table);

                // Also release any tables merged into this one
                List<DiningTable> mergedTables = diningTableRepository.findByMergedIntoId(table.getId());
                for (DiningTable childTable : mergedTables) {
                    childTable.setMergedInto(null);
                    childTable.setStatus("Available");
                    childTable.setActiveOrderId(null);
                    diningTableRepository.save(childTable);
                }
            }
        }

        // 1. Deduct Stock based on recipe mappings
        inventoryService.deductStockForOrder(order);

        // 2. Process CRM Loyalty points (1 point per 10 currency units spent)
        if (order.getCustomer() != null) {
            Customer customer = order.getCustomer();
            int pointsEarned = order.getTotalAmount().divide(BigDecimal.valueOf(10), 0, RoundingMode.DOWN).intValue();
            
            customer.setLoyaltyPoints(customer.getLoyaltyPoints() + pointsEarned);
            customerRepository.save(customer);

            Optional<LoyaltyWallet> walletOpt = loyaltyWalletRepository.findByCustomerId(customer.getId());
            if (walletOpt.isPresent()) {
                LoyaltyWallet wallet = walletOpt.get();
                wallet.setBalancePoints(wallet.getBalancePoints() + pointsEarned);
                loyaltyWalletRepository.save(wallet);
            }
            log.info("Loyalty points credited to customer: +{} points", pointsEarned);
        }

        return savedPayment;
    }
}
