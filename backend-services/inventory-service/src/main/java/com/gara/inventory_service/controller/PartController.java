package com.gara.inventory_service.controller;

import com.gara.inventory_service.dto.PartDTO;
import com.gara.inventory_service.entity.Part;
import com.gara.inventory_service.service.PartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory/parts")
@RequiredArgsConstructor
public class PartController {

    private final PartService partService;

    @PostMapping
    public ResponseEntity<Part> createPart(@Valid @RequestBody PartDTO dto) {
        return ResponseEntity.ok(partService.createPart(dto));
    }

    @GetMapping
    public ResponseEntity<List<Part>> getAllParts() {
        return ResponseEntity.ok(partService.getAllParts());
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
            @RequestParam int quantityChange) {
        return ResponseEntity.ok(partService.updateStock(id, quantityChange));
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