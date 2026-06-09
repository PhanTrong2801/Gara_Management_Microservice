package com.gara.repair_service.service;

import com.gara.repair_service.entity.RepairOrder;
import com.gara.repair_service.entity.RepairPart;
import com.gara.repair_service.entity.RepairTask;
import com.gara.repair_service.repository.RepairOrderRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.gara.repair_service.dto.StockCheckRequest;
import com.gara.repair_service.dto.InventoryDeductEvent;

@Service
@RequiredArgsConstructor
public class RepairOrderService {

    private final RepairOrderRepository repairOrderRepository;
    private final RabbitTemplate rabbitTemplate;
    private final InventoryClient inventoryClient;

    public RepairOrder createRepairOrder(RepairOrder order, String creatorUsername){
        // Tự động sinh mã phiếu duy nhất: RO + Năm hiện tại + 8 ký tự mã ngẫu nhiên
        String year = String.valueOf(LocalDateTime.now().getYear());
        String shortUuid = UUID.randomUUID().toString().substring(0,8).toUpperCase();
        order.setOrderNumber("RO-" +year + "-"+shortUuid);

        // Mặc định xe mới vào xưởng sẽ ở trạng thái chờ chẩn đoán (PENDING)
        order.setStatus("PENDING");
        order.setCreatedAt(LocalDateTime.now());

        // Ghi nhận ID của người lập phiếu (Lễ tân) lấy từ ngữ cảnh đăng nhập
        // Trong thực tế bạn có thể thêm mảng logs để lưu vết lịch sử
        System.out.println("Phiếu được tạo bới nhân viên: "+ creatorUsername);
        order.setCreatedBy(creatorUsername);

        return repairOrderRepository.save(order);
    }

    public RepairOrder getOrderDetails(String orderNumber){
        return repairOrderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(()-> new RuntimeException("Không tìm thấy phiếu sửa chữa yêu cầu "));
    }

    public List<RepairOrder> getAllOrders(){
        return repairOrderRepository.findAll();
    }

    public List<RepairOrder> getOrdersByCustomerId(Long customerId) {
        return repairOrderRepository.findByCustomerId(customerId);
    }

    public RepairOrder updateOrderStatus(String id, String status, Long mechanicId) {
        RepairOrder order = repairOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu sửa chữa"));
        
        boolean isJustCompleted = "COMPLETED".equals(status) && !"COMPLETED".equals(order.getStatus());
        
        // --- KIỂM TRA TỒN KHO ĐỒNG BỘ TRƯỚC KHI CHO PHÉP HOÀN THÀNH ---
        if (isJustCompleted && order.getParts() != null && !order.getParts().isEmpty()) {
            StockCheckRequest request = new StockCheckRequest();
            List<StockCheckRequest.PartRequest> partRequests = order.getParts().stream()
                    .map(p -> new StockCheckRequest.PartRequest(p.getPartId(), p.getQuantity()))
                    .collect(Collectors.toList());
            request.setParts(partRequests);
            
            try {
                inventoryClient.checkStock(request);
            } catch (feign.FeignException.BadRequest e) {
                // e.contentUTF8() sẽ chứa chuỗi lỗi từ Inventory Service (ví dụ: "Phụ tùng LỐP XE không đủ...")
                throw new RuntimeException(e.contentUTF8());
            } catch (Exception e) {
                throw new RuntimeException("Lỗi kết nối đến kho vật tư để kiểm tra tồn kho. Vui lòng thử lại sau.");
            }
        }
        
        order.setStatus(status);
        if (mechanicId != null) {
            order.setMechanicId(mechanicId);
        }
        
        RepairOrder savedOrder = repairOrderRepository.save(order);

        // Gửi tin nhắn sang RabbitMQ để trừ kho (Lúc này chắc chắn kho đủ)
        if (isJustCompleted && savedOrder.getParts() != null && !savedOrder.getParts().isEmpty()) {
            InventoryDeductEvent event = new InventoryDeductEvent();
            event.setOrderNumber(savedOrder.getOrderNumber());
            
            List<InventoryDeductEvent.PartUsage> usages = savedOrder.getParts().stream()
                .map(p -> new InventoryDeductEvent.PartUsage(p.getPartId(), p.getQuantity()))
                .collect(Collectors.toList());
            
            event.setUsedParts(usages);
            rabbitTemplate.convertAndSend("gara.exchange", "repair.completed", event);
            System.out.println("Đã gửi sự kiện trừ kho cho phiếu: " + savedOrder.getOrderNumber());
        }

        return savedOrder;
    }

    public RepairOrder updateTasksAndParts(String id, List<RepairTask> tasks, List<RepairPart> parts) {
        RepairOrder order = repairOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu sửa chữa"));
        
        if (tasks != null) {
            order.setTasks(tasks);
        }
        if (parts != null) {
            order.setParts(parts);
        }
        
        return repairOrderRepository.save(order);
    }

    public RepairOrder updateRepairTask(String orderId, int taskIndex, String status, String note) {
        RepairOrder order = repairOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu sửa chữa"));
        
        List<RepairTask> tasks = order.getTasks();
        if (tasks == null || taskIndex < 0 || taskIndex >= tasks.size()) {
            throw new RuntimeException("Hạng mục công việc không hợp lệ");
        }
        
        RepairTask task = tasks.get(taskIndex);
        if (status != null) {
            task.setStatus(status);
        }
        if (note != null) {
            task.setMechanicNote(note);
        }
        
        return repairOrderRepository.save(order);
    }
}
