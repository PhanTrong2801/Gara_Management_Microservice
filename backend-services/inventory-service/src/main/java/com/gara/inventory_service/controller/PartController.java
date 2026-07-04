package com.gara.inventory_service.controller;

import com.gara.inventory_service.dto.PartDTO;
import com.gara.inventory_service.entity.Part;
import com.gara.inventory_service.service.PartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

import com.gara.inventory_service.service.InventoryTransactionService;
import com.gara.inventory_service.dto.InventoryTransactionDTO;

@RestController
@RequestMapping("/api/inventory/parts")
@RequiredArgsConstructor
public class PartController {

    private final PartService partService;
    private final InventoryTransactionService transactionService;

    @PostMapping
    public ResponseEntity<?> createPart(@Valid @RequestBody PartDTO dto) {
        try {
            return ResponseEntity.ok(partService.createPart(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePart(@PathVariable Long id, @Valid @RequestBody PartDTO dto) {
        try {
            return ResponseEntity.ok(partService.updatePart(id, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePart(@PathVariable Long id) {
        try {
            partService.deletePart(id);
            return ResponseEntity.ok(java.util.Map.of("message", "Đã xóa phụ tùng thành công!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<Page<Part>> getAllParts(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(partService.getAllParts(search, pageable));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<Page<Part>> getLowStockParts(
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(partService.getLowStockParts(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Part> getPartById(@PathVariable Long id) {
        return ResponseEntity.ok(partService.getPartById(id));
    }

    // API Cập nhật kho.
    // Nếu truyền quantityChange = 5 (Nhập thêm 5 món)
    // Nếu truyền quantityChange = -2 (Thợ lấy ra 2 món)
    @PatchMapping("/{id}/stock")
    public ResponseEntity<Part> updateStock(
            @PathVariable Long id,
            @RequestParam int quantityChange,
            @RequestParam(required = false, defaultValue = "MANUAL_ADJUST") String reference) {
        String type = quantityChange > 0 ? "MANUAL_ADJUST (NHẬP)" : "MANUAL_ADJUST (XUẤT)";
        return ResponseEntity.ok(partService.updateStock(id, quantityChange, type, reference));
    }

    @GetMapping("/{id}/transactions")
    public ResponseEntity<Page<InventoryTransactionDTO>> getTransactions(
            @PathVariable Long id,
            @PageableDefault(size = 10, sort = "transactionDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(transactionService.getTransactionsByPartId(id, pageable));
    }

    @PostMapping("/check-stock")
    public ResponseEntity<String> checkStock(@RequestBody com.gara.inventory_service.dto.StockCheckRequest request) {
        try {
            partService.checkStock(request);
            return ResponseEntity.ok("OK");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}