package com.gara.repair_service.service;

import com.gara.repair_service.entity.RepairOrder;
import com.gara.repair_service.repository.RepairOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SagaReplyListener {

    private final RepairOrderRepository repairOrderRepository;
    private final RepairOrderService repairOrderService;

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "repair.saga.reply.queue", durable = "true"),
            exchange = @Exchange(value = "gara.exchange", type = "topic"),
            key = "inventory.deducted.*"
    ))
    @Transactional
    public void handleInventoryReply(String orderNumber, org.springframework.amqp.core.Message message) {
        String routingKey = message.getMessageProperties().getReceivedRoutingKey();
        
        // Loại bỏ dấu ngoặc kép thừa do Jackson Serialize chuỗi String
        String cleanOrderNumber = orderNumber.replace("\"", "");
        
        log.info("Nhận phản hồi Saga từ Kho hàng cho phiếu {}: {}", cleanOrderNumber, routingKey);

        RepairOrder order = repairOrderRepository.findByOrderNumber(cleanOrderNumber)
                .orElse(null);
        if (order == null) {
            log.error("LỖI SAGA: Không tìm thấy phiếu sửa chữa {}", cleanOrderNumber);
            return;
        }

        if ("inventory.deducted.success".equals(routingKey)) {
            order.setStatus("COMPLETED");
            order.setInventoryDeducted(true);
            order.setCustomerNotified(true);
            repairOrderRepository.save(order);
            log.info("SAGA THÀNH CÔNG: Kho xác nhận xuất hàng. Đã chốt phiếu {} sang COMPLETED", cleanOrderNumber);
            
            // Kho xuất thành công thì mới bắn thông báo khách hàng ra nhận xe
            repairOrderService.sendCustomerNotificationEvent(order);
            
        } else if ("inventory.deducted.failed".equals(routingKey)) {
            // Lùi trạng thái lại như cũ
            order.setStatus("REPAIRING"); 
            order.setInventoryDeducted(false);
            
            // Thêm ghi chú cho thợ vào hạng mục đầu tiên (nếu có)
            if (order.getTasks() != null && !order.getTasks().isEmpty()) {
                String oldNote = order.getTasks().get(0).getMechanicNote();
                String errorMsg = "HỆ THỐNG TỪ CHỐI CHỐT PHIẾU: Không đủ phụ tùng trong kho!";
                order.getTasks().get(0).setMechanicNote(oldNote != null ? oldNote + " | " + errorMsg : errorMsg);
            }
            repairOrderRepository.save(order);
            log.warn("SAGA THẤT BẠI: Kho hết hàng. Đã lùi phiếu {} về REPAIRING", cleanOrderNumber);
        }
    }
}
