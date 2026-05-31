package com.gara.repair_service.controller;

import com.gara.repair_service.dto.RepairDetailsDTO;
import com.gara.repair_service.entity.RepairOrder;
import com.gara.repair_service.service.RepairOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/orders")
    public ResponseEntity<List<RepairOrder>> getAllOrders(){
        return ResponseEntity.ok(repairOrderService.getAllOrders());
    }

    // API Cập nhật trạng thái phiếu sửa chữa
    @PutMapping("/orders/{id}/status")
    public ResponseEntity<RepairOrder> updateOrderStatus(
            @PathVariable String id,
            @RequestBody java.util.Map<String, Object> body
    ){
        String status = (String) body.get("status");
        Long mechanicId = body.get("mechanicId") != null ? Long.valueOf(body.get("mechanicId").toString()) : null;
        return ResponseEntity.ok(repairOrderService.updateOrderStatus(id, status, mechanicId));
    }

    // API Cập nhật chi tiết (công thợ và phụ tùng) cho phiếu sửa chữa
    @PutMapping("/orders/{id}/details")
    public ResponseEntity<RepairOrder> updateOrderDetails(
            @PathVariable String id,
            @RequestBody RepairDetailsDTO details
    ){
        return ResponseEntity.ok(repairOrderService.updateTasksAndParts(id, details.getTasks(), details.getParts()));
    }
}
