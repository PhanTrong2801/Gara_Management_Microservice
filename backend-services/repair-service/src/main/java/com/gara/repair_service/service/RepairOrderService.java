package com.gara.repair_service.service;

import com.gara.repair_service.entity.RepairOrder;
import com.gara.repair_service.entity.RepairPart;
import com.gara.repair_service.entity.RepairTask;
import com.gara.repair_service.repository.RepairOrderRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.gara.repair_service.dto.StockCheckRequest;
import com.gara.repair_service.dto.InventoryDeductEvent;
import com.gara.repair_service.dto.NotificationEvent;
import java.util.HashMap;
import java.util.Map;

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

    public Page<RepairOrder> getAllOrders(String keyword, Pageable pageable) {
        if (keyword == null || keyword.isBlank()) {
            return repairOrderRepository.findAll(pageable);
        }
        return repairOrderRepository.searchRepairOrders(keyword, pageable);
    }

    public List<RepairOrder> getOrdersByCustomerId(Long customerId) {
        return repairOrderRepository.findByCustomerId(customerId);
    }

    public List<RepairOrder> getOrdersByMechanicId(Long mechanicId) {
        // Trả về các phiếu được gán cho thợ này và chưa hoàn thành
        return repairOrderRepository.findByMechanicIdAndStatusNot(mechanicId, "COMPLETED");
    }

    public RepairOrder updateOrderStatus(String id, String status, Long mechanicId) {
        RepairOrder order = repairOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu sửa chữa"));
        
        boolean isRequestingComplete = "COMPLETED".equals(status) && !"COMPLETED".equals(order.getStatus());
        
        if (mechanicId != null) {
            order.setMechanicId(mechanicId);
        }
        
        if (isRequestingComplete) {
            if (order.getParts() != null && !order.getParts().isEmpty()) {
                // Áp dụng Saga Pattern: Chuyển sang trạng thái chờ kho xác nhận thay vì COMPLETED ngay
                order.setStatus("WAITING_INVENTORY");
                order.setInventoryDeducted(false);
                order.setCustomerNotified(false);
                RepairOrder savedOrder = repairOrderRepository.save(order);
                
                // Gửi sự kiện trừ kho sang RabbitMQ
                sendInventoryDeductEvent(savedOrder);
                return savedOrder;
            } else {
                // Không dùng phụ tùng nào -> Hoàn thành luôn
                order.setStatus("COMPLETED");
                order.setInventoryDeducted(true);
                order.setCustomerNotified(true);
                RepairOrder savedOrder = repairOrderRepository.save(order);
                
                // Gửi thông báo cho khách hàng
                sendCustomerNotificationEvent(savedOrder);
                return savedOrder;
            }
        }
        
        order.setStatus(status);
        return repairOrderRepository.save(order);
    }

    public void sendInventoryDeductEvent(RepairOrder order) {
        if (order.getParts() != null && !order.getParts().isEmpty()) {
            InventoryDeductEvent event = new InventoryDeductEvent();
            event.setOrderNumber(order.getOrderNumber());
            
            List<InventoryDeductEvent.PartUsage> usages = order.getParts().stream()
                .map(p -> new InventoryDeductEvent.PartUsage(p.getPartId(), p.getQuantity()))
                .collect(Collectors.toList());
            
            event.setUsedParts(usages);
            rabbitTemplate.convertAndSend("gara.exchange", "repair.completed", event);
            System.out.println("Đã gửi sự kiện trừ kho cho phiếu: " + order.getOrderNumber());
        }
    }

    public void sendCustomerNotificationEvent(RepairOrder order) {
        if (order.getCustomerId() != null) {
            NotificationEvent notifEvent = new NotificationEvent();
            notifEvent.setCustomerId(order.getCustomerId());
            notifEvent.setTitle("Xe đã sửa xong!");
            notifEvent.setBody("Phiếu sửa chữa " + order.getOrderNumber() + " đã hoàn thành. Bạn có thể đến gara để nhận xe.");
            Map<String, String> data = new HashMap<>();
            data.put("orderNumber", order.getOrderNumber());
            notifEvent.setData(data);
            
            rabbitTemplate.convertAndSend("notification.exchange", "notification.repair", notifEvent);
            System.out.println("Đã gửi sự kiện thông báo cho khách hàng: " + order.getCustomerId());
        }
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

    public RepairOrder approveOrder(String orderId, String signatureBase64) {
        RepairOrder order = repairOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu sửa chữa"));
        
        order.setCustomerApproved(true);
        order.setCustomerSignatureBase64(signatureBase64);
        order.setStatus("APPROVED"); // Cập nhật trạng thái sang APPROVED hoặc REPAIRING tùy luồng
        
        return repairOrderRepository.save(order);
    }
}
