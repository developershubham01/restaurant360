package com.abwcurious.restaurant.kitchen;

import com.abwcurious.restaurant.order.Order;
import com.abwcurious.restaurant.order.OrderItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.abwcurious.restaurant.kitchen.KotTicketRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class KitchenService {

    private final KotTicketRepository kotTicketRepository;
    private final KotItemRepository kotItemRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public KotTicket createKot(Order order) {
        log.info("Generating KOT for Order ID: {}", order.getId());

        long count = kotTicketRepository.count() + 1;
        String ticketNumber = "KOT-" + String.format("%06d", count);

        KotTicket ticket = KotTicket.builder()
                .uuid(UUID.randomUUID().toString())
                .outlet(order.getOutlet())
                .order(order)
                .ticketNumber(ticketNumber)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        KotTicket savedTicket = kotTicketRepository.save(ticket);

        for (OrderItem item : order.getItems()) {
            KotItem kotItem = KotItem.builder()
                    .kotTicket(savedTicket)
                    .orderItem(item)
                    .quantity(item.getQuantity())
                    .status("PENDING")
                    .build();
            kotItemRepository.save(kotItem);
            savedTicket.getItems().add(kotItem);
        }

        // Push live update via WebSocket
        sendWebSocketUpdate(savedTicket);

        return savedTicket;
    }

    @Transactional
    public KotTicket updateKotStatus(Long ticketId, String newStatus) {
        log.info("Updating KOT ID: {} to status: {}", ticketId, newStatus);
        KotTicket ticket = kotTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("KOT not found"));

        ticket.setStatus(newStatus);
        for (KotItem item : ticket.getItems()) {
            item.setStatus(newStatus);
            kotItemRepository.save(item);
        }

        KotTicket updated = kotTicketRepository.save(ticket);

        // Push update
        sendWebSocketUpdate(updated);

        return updated;
    }

    private void sendWebSocketUpdate(KotTicket ticket) {
        try {
            // Simplify object to prevent infinite recursion during JSON serialization
            String message = String.format(
                    "{\"ticketNumber\":\"%s\", \"uuid\":\"%s\", \"status\":\"%s\", \"outletId\":%d, \"orderNumber\":\"%s\"}",
                    ticket.getTicketNumber(),
                    ticket.getUuid(),
                    ticket.getStatus(),
                    ticket.getOutlet().getId(),
                    ticket.getOrder().getOrderNumber()
            );
            messagingTemplate.convertAndSend("/topic/kot", message);
            log.info("WebSocket update dispatched for KOT: {}", ticket.getTicketNumber());
        } catch (Exception e) {
            log.error("Failed to push KOT WebSocket update", e);
        }
    }
}
