package com.abwcurious.restaurant.order;

import com.abwcurious.restaurant.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final OrderRepository orderRepository;

    public OrderController(OrderService orderService, OrderRepository orderRepository) {
        this.orderService = orderService;
        this.orderRepository = orderRepository;
    }

    /**
     * POST /api/orders — Create a new order and dispatch KOT.
     * Returns OrderResponseDto to avoid Jackson infinite circular reference.
     */
    @PostMapping
    public ApiResponse<OrderResponseDto> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        Order order = orderService.createOrder(request);
        return ApiResponse.success(OrderResponseDto.from(order), "Order created and KOT dispatched successfully");
    }

    /**
     * POST /api/orders/{id}/pay — Settle payment for an order.
     */
    @PostMapping("/{id}/pay")
    public ApiResponse<PaymentResponseDto> payOrder(
            @PathVariable Long id,
            @RequestParam String paymentMethod,
            @RequestParam(required = false) String transactionReference) {
        Payment payment = orderService.processPayment(id, paymentMethod, transactionReference);
        return ApiResponse.success(PaymentResponseDto.from(payment), "Payment recorded and stock deducted successfully");
    }

    /**
     * GET /api/orders/{id} — Get a single order by ID.
     */
    @GetMapping("/{id}")
    public ApiResponse<OrderResponseDto> getOrder(@PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        return ApiResponse.success(OrderResponseDto.from(order));
    }

    /**
     * GET /api/orders?outletId={id} — List all orders for an outlet.
     */
    @GetMapping
    public ApiResponse<List<OrderResponseDto>> getOrders(@RequestParam Long outletId) {
        List<Order> orders = orderRepository.findByOutletId(outletId);
        List<OrderResponseDto> dtos = orders.stream()
                .map(OrderResponseDto::from)
                .collect(Collectors.toList());
        return ApiResponse.success(dtos);
    }
}
