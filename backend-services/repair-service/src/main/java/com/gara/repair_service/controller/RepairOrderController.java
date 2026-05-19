package com.gara.repair_service.controller;

import com.gara.repair_service.entity.RepairOrder;
import com.gara.repair_service.service.RepairOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/repair")
@RequiredArgsConstructor
public class RepairOrderController {

    private final RepairOrderService repairOrderService;

    // API Tạo mới phiếu sửa chữa
    @PostMapping("/orders")
    public ResponseEntity<RepairOrder> createOrder(
            @RequestBody RepairOrder order,
            @RequestHeader(value = "X-User-Username", required = false) String username
    ){
        // Lấy username từ Header do API Gateway chuyển tiếp xuống
        String creator = (username != null) ?username : "ANONYMOUS";
        RepairOrder saveOrder = repairOrderService.createRepairOrder(order,creator);
        return ResponseEntity.ok(saveOrder);
    }

    // API Lấy chi tiết phiếu dựa theo mã phiếu
    @GetMapping("/orders/{orderNumber}")
    public ResponseEntity<RepairOrder> getOrder(@PathVariable String orderNumber){
        return ResponseEntity.ok(repairOrderService.getOrderDetails(orderNumber));
    }
}
