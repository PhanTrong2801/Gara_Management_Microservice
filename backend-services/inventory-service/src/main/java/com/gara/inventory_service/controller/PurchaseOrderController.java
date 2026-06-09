package com.gara.inventory_service.controller;

import com.gara.inventory_service.dto.PurchaseOrderDTO;
import com.gara.inventory_service.entity.PurchaseOrder;
import com.gara.inventory_service.entity.PurchaseOrderItem;
import com.gara.inventory_service.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @PostMapping
    public ResponseEntity<PurchaseOrder> createPurchaseOrder(@RequestBody PurchaseOrderDTO dto) {
        return ResponseEntity.ok(purchaseOrderService.createPurchaseOrder(dto));
    }

    @GetMapping
    public ResponseEntity<List<PurchaseOrder>> getAllPurchaseOrders() {
        return ResponseEntity.ok(purchaseOrderService.getAllPurchaseOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrder> getPurchaseOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseOrderService.getPurchaseOrderById(id));
    }

    @GetMapping("/{id}/items")
    public ResponseEntity<List<PurchaseOrderItem>> getPurchaseOrderItems(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseOrderService.getPurchaseOrderItems(id));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<PurchaseOrder> completePurchaseOrder(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseOrderService.completePurchaseOrder(id));
    }
}
