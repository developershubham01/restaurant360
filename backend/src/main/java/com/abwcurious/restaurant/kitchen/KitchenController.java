package com.abwcurious.restaurant.kitchen;

import com.abwcurious.restaurant.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/kitchen")
public class KitchenController {

    private final KotTicketRepository kotTicketRepository;
    private final KitchenService kitchenService;

    public KitchenController(KotTicketRepository kotTicketRepository, KitchenService kitchenService) {
        this.kotTicketRepository = kotTicketRepository;
        this.kitchenService = kitchenService;
    }

    @GetMapping("/tickets")
    public ApiResponse<List<KotTicketResponseDto>> getActiveTickets(@RequestParam Long outletId) {
        // Fetch all tickets that are NOT "SERVED"
        List<KotTicket> tickets = kotTicketRepository.findByOutletIdAndStatusNot(outletId, "SERVED");
        
        List<KotTicketResponseDto> dtos = tickets.stream()
                .map(KotTicketResponseDto::fromEntity)
                .collect(Collectors.toList());

        return ApiResponse.success(dtos);
    }

    @PutMapping("/tickets/{id}/status")
    @Transactional
    public ApiResponse<KotTicketResponseDto> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        
        KotTicket updated = kitchenService.updateKotStatus(id, status.toUpperCase());
        return ApiResponse.success(KotTicketResponseDto.fromEntity(updated), "KOT status updated successfully");
    }
}
