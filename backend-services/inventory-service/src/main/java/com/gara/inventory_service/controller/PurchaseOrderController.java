package com.gara.inventory_service.controller;

import com.gara.inventory_service.dto.PurchaseOrderDTO;
import com.gara.inventory_service.entity.PurchaseOrder;
import com.gara.inventory_service.entity.PurchaseOrderItem;
import com.gara.inventory_service.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

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
    public ResponseEntity<Page<PurchaseOrder>> getAllPurchaseOrders(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10, sort = "orderDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(purchaseOrderService.getAllPurchaseOrders(search, pageable));
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
