package com.abwcurious.restaurant.table;

import com.abwcurious.restaurant.common.ApiResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tables")
public class TableController {

    private final DiningTableRepository tableRepository;
    private final DiningFloorRepository floorRepository;

    public TableController(DiningTableRepository tableRepository, DiningFloorRepository floorRepository) {
        this.tableRepository = tableRepository;
        this.floorRepository = floorRepository;
    }

    @GetMapping
    public ApiResponse<List<TableResponseDto>> getAllTables() {
        List<DiningTable> tables = tableRepository.findAll();
        List<TableResponseDto> dtos = tables.stream()
                .map(TableResponseDto::from)
                .collect(Collectors.toList());
        return ApiResponse.success(dtos);
    }

    @GetMapping("/floors")
    public ApiResponse<List<DiningFloor>> getAllFloors() {
        List<DiningFloor> floors = floorRepository.findByActiveTrue();
        return ApiResponse.success(floors);
    }

    @PostMapping("/floors")
    @Transactional
    public ApiResponse<DiningFloor> createFloor(@RequestParam String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Floor name cannot be empty");
        }
        DiningFloor floor = DiningFloor.builder()
                .name(name.trim())
                .active(true)
                .build();
        DiningFloor saved = floorRepository.save(floor);
        return ApiResponse.success(saved, "Floor section created successfully");
    }

    @DeleteMapping("/floors/{id}")
    @Transactional
    public ApiResponse<Void> deleteFloor(@PathVariable Long id) {
        DiningFloor floor = floorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Floor not found"));
        floor.setActive(false);
        floorRepository.save(floor);

        List<DiningTable> tablesOnFloor = tableRepository.findByFloorId(id);
        tableRepository.deleteAll(tablesOnFloor);

        return ApiResponse.success(null, "Floor section deleted successfully");
    }

    @PostMapping
    @Transactional
    public ApiResponse<TableResponseDto> createTable(
            @RequestParam String id,
            @RequestParam int seats,
            @RequestParam Long floorId) {
        
        if (id == null || id.trim().isEmpty()) {
            throw new IllegalArgumentException("Table number/ID cannot be empty");
        }
        if (tableRepository.existsById(id)) {
            throw new IllegalArgumentException("Table with ID " + id + " already exists");
        }
        DiningFloor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new IllegalArgumentException("Floor section not found"));

        DiningTable table = new DiningTable(id.trim(), seats, "Available", floor);
        DiningTable saved = tableRepository.save(table);
        return ApiResponse.success(TableResponseDto.from(saved), "Table created successfully");
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ApiResponse<String> deleteTable(@PathVariable String id) {
        DiningTable table = tableRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Table not found"));
        tableRepository.delete(table);
        return ApiResponse.success(id, "Table deleted successfully");
    }

    @PutMapping("/{id}/status")
    @Transactional
    public ApiResponse<TableResponseDto> updateTableStatus(
            @PathVariable String id,
            @RequestParam String status) {
        DiningTable table = tableRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Table not found"));
        table.setStatus(status);
        if ("Available".equalsIgnoreCase(status)) {
            table.setActiveOrderId(null);
            table.setWaiterName(null);
            table.setCustomerName(null);
            table.setCustomerPhone(null);
            table.setReservationTime(null);
        }
        DiningTable saved = tableRepository.save(table);
        return ApiResponse.success(TableResponseDto.from(saved), "Table status updated to " + status);
    }

    @PostMapping("/merge")
    @Transactional
    public ApiResponse<List<TableResponseDto>> mergeTables(
            @RequestParam String targetTableId,
            @RequestParam List<String> sourceTableIds) {
        
        DiningTable targetTable = tableRepository.findById(targetTableId)
                .orElseThrow(() -> new IllegalArgumentException("Target table not found: " + targetTableId));

        for (String sourceId : sourceTableIds) {
            if (sourceId.equals(targetTableId)) continue;
            DiningTable sourceTable = tableRepository.findById(sourceId)
                    .orElseThrow(() -> new IllegalArgumentException("Source table not found: " + sourceId));
            sourceTable.setMergedInto(targetTable);
            sourceTable.setStatus("Occupied");
            tableRepository.save(sourceTable);
        }

        List<DiningTable> allTables = tableRepository.findAll();
        List<TableResponseDto> dtos = allTables.stream()
                .map(TableResponseDto::from)
                .collect(Collectors.toList());

        return ApiResponse.success(dtos, "Tables successfully merged into " + targetTableId);
    }

    @PostMapping("/unmerge")
    @Transactional
    public ApiResponse<List<TableResponseDto>> unmergeTables(@RequestParam String parentTableId) {
        List<DiningTable> children = tableRepository.findByMergedIntoId(parentTableId);
        for (DiningTable child : children) {
            child.setMergedInto(null);
            child.setStatus("Available");
            tableRepository.save(child);
        }

        List<DiningTable> allTables = tableRepository.findAll();
        List<TableResponseDto> dtos = allTables.stream()
                .map(TableResponseDto::from)
                .collect(Collectors.toList());

        return ApiResponse.success(dtos, "Tables unmerged successfully");
    }

    @PostMapping("/transfer")
    @Transactional
    public ApiResponse<List<TableResponseDto>> transferTable(
            @RequestParam String fromTableId,
            @RequestParam String toTableId) {
        
        DiningTable fromTable = tableRepository.findById(fromTableId)
                .orElseThrow(() -> new IllegalArgumentException("Source table not found: " + fromTableId));
        DiningTable toTable = tableRepository.findById(toTableId)
                .orElseThrow(() -> new IllegalArgumentException("Destination table not found: " + toTableId));

        if (!"Available".equalsIgnoreCase(toTable.getStatus())) {
            throw new IllegalStateException("Destination table must be Available");
        }

        // Transfer order details
        toTable.setActiveOrderId(fromTable.getActiveOrderId());
        toTable.setWaiterName(fromTable.getWaiterName());
        toTable.setCustomerName(fromTable.getCustomerName());
        toTable.setCustomerPhone(fromTable.getCustomerPhone());
        toTable.setStatus(fromTable.getStatus());

        // Clear source table
        fromTable.setActiveOrderId(null);
        fromTable.setWaiterName(null);
        fromTable.setCustomerName(null);
        fromTable.setCustomerPhone(null);
        fromTable.setStatus("Available");

        tableRepository.save(fromTable);
        tableRepository.save(toTable);

        List<DiningTable> allTables = tableRepository.findAll();
        List<TableResponseDto> dtos = allTables.stream()
                .map(TableResponseDto::from)
                .collect(Collectors.toList());

        return ApiResponse.success(dtos, "Running order successfully transferred from " + fromTableId + " to " + toTableId);
    }

    @PostMapping("/reserve")
    @Transactional
    public ApiResponse<TableResponseDto> reserveTable(
            @RequestParam String tableId,
            @RequestParam String customerName,
            @RequestParam String customerPhone,
            @RequestParam String reservationTime) {
        
        DiningTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new IllegalArgumentException("Table not found: " + tableId));

        table.setStatus("Reserved");
        table.setCustomerName(customerName);
        table.setCustomerPhone(customerPhone);
        table.setReservationTime(LocalDateTime.parse(reservationTime));
        
        DiningTable saved = tableRepository.save(table);
        return ApiResponse.success(TableResponseDto.from(saved), "Table reserved successfully");
    }
}
