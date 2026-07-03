package com.gara.inventory_service.service;

import com.gara.inventory_service.config.RabbitMQConfig;
import com.gara.inventory_service.dto.InventoryDeductEvent;
import com.gara.inventory_service.repository.PartRepository;
import com.gara.inventory_service.entity.Part;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryEventListener {

    private final PartRepository partRepository;
    private final InventoryTransactionService transactionService;
    private final RabbitTemplate rabbitTemplate;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    @Transactional
    public void handleInventoryDeduction(InventoryDeductEvent event) {
        log.info("Nhận yêu cầu trừ tồn kho cho phiếu sửa chữa: {}", event.getOrderNumber());

        if (event.getUsedParts() == null || event.getUsedParts().isEmpty()) {
            return;
        }

        try {
            for (InventoryDeductEvent.PartUsage usage : event.getUsedParts()) {
                Part part = partRepository.findById(usage.getPartId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy phụ tùng " + usage.getPartId()));
                
                int newStock = part.getStockQuantity() - usage.getQuantity();
                if (newStock < 0) {
                    throw new RuntimeException("Không đủ tồn kho cho phụ tùng: " + part.getName());
                }
                
                part.setStockQuantity(newStock);
                Part savedPart = partRepository.save(part);
                transactionService.recordTransaction(savedPart, "EXPORT_REPAIR", -usage.getQuantity(), event.getOrderNumber());
            }
            
            log.info("Hoàn tất trừ kho cho phiếu: {}", event.getOrderNumber());
            // Trừ kho thành công -> Gửi phản hồi SAGA success về Repair Service
            rabbitTemplate.convertAndSend("gara.exchange", "inventory.deducted.success", event.getOrderNumber());
            
        } catch (Exception e) {
            log.error("LỖI SAGA: Từ chối trừ kho cho phiếu {}. Nguyên nhân: {}", event.getOrderNumber(), e.getMessage());
            // Trừ kho thất bại -> Gửi phản hồi SAGA failed về Repair Service
            rabbitTemplate.convertAndSend("gara.exchange", "inventory.deducted.failed", event.getOrderNumber());
            // Quăng lỗi ra để Spring tự động Rollback lại DB trong trường hợp đã trừ 1 nửa nhưng báo lỗi ở phụ tùng sau
            throw e; 
        }
    }
}
