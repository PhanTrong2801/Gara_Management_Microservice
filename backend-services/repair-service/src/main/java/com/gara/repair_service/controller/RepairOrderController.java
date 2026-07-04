package com.gara.repair_service.controller;

import com.gara.repair_service.dto.RepairDetailsDTO;
import com.gara.repair_service.entity.RepairOrder;
import com.gara.repair_service.service.RepairOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
    public ResponseEntity<Page<RepairOrder>> getAllOrders(
            @RequestParam(required = false, defaultValue = "") String search,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(repairOrderService.getAllOrders(search, pageable));
    }

    @GetMapping("/orders/customer/{customerId}")
    public ResponseEntity<List<RepairOrder>> getOrdersByCustomerId(@PathVariable Long customerId){
        return ResponseEntity.ok(repairOrderService.getOrdersByCustomerId(customerId));
    }

    // API Cập nhật trạng thái phiếu sửa chữa
    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable String id,
            @RequestBody java.util.Map<String, Object> body
    ){
        try {
            String status = (String) body.get("status");
            Long mechanicId = body.get("mechanicId") != null ? Long.valueOf(body.get("mechanicId").toString()) : null;
            return ResponseEntity.ok(repairOrderService.updateOrderStatus(id, status, mechanicId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API Cập nhật chi tiết (công thợ và phụ tùng) cho phiếu sửa chữa
    @PutMapping("/orders/{id}/details")
    public ResponseEntity<RepairOrder> updateOrderDetails(
            @PathVariable String id,
            @RequestBody RepairDetailsDTO details
    ){
        return ResponseEntity.ok(repairOrderService.updateTasksAndParts(id, details.getTasks(), details.getParts()));
    }

    // API dành cho thợ máy cập nhật trạng thái của từng công việc
    @PutMapping("/orders/{id}/tasks/{taskIndex}")
    public ResponseEntity<?> updateTaskStatus(
            @PathVariable String id,
            @PathVariable int taskIndex,
            @RequestBody java.util.Map<String, String> body
    ) {
        try {
            String status = body.get("status");
            String note = body.get("mechanicNote");
            return ResponseEntity.ok(repairOrderService.updateRepairTask(id, taskIndex, status, note));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API Khách hàng duyệt báo giá và gửi chữ ký
    @PutMapping("/orders/{id}/approve")
    public ResponseEntity<?> approveOrder(
            @PathVariable String id,
            @RequestBody java.util.Map<String, String> body
    ) {
        try {
            String signatureBase64 = body.get("signatureBase64");
            return ResponseEntity.ok(repairOrderService.approveOrder(id, signatureBase64));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
