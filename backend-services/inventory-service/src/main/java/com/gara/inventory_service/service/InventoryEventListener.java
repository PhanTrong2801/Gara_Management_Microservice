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

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryEventListener {

    private final PartRepository partRepository;
    private final InventoryTransactionService transactionService;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    @Transactional
    public void handleInventoryDeduction(InventoryDeductEvent event) {
        log.info("Nhận yêu cầu trừ tồn kho cho phiếu sửa chữa: {}", event.getOrderNumber());

        if (event.getUsedParts() == null || event.getUsedParts().isEmpty()) {
            log.info("Phiếu {} không sử dụng phụ tùng nào.", event.getOrderNumber());
            return;
        }

        for (InventoryDeductEvent.PartUsage usage : event.getUsedParts()) {
            partRepository.findById(usage.getPartId()).ifPresentOrElse(part -> {
                int newStock = part.getStockQuantity() - usage.getQuantity();
                part.setStockQuantity(newStock);
                Part savedPart = partRepository.save(part);
                transactionService.recordTransaction(savedPart, "EXPORT_REPAIR", -usage.getQuantity(), event.getOrderNumber());
                
                if (newStock < 0) {
                    log.warn("CẢNH BÁO: Phụ tùng {} ({}) bị âm kho! Số lượng hiện tại: {}", 
                        part.getPartCode(), part.getName(), newStock);
                } else {
                    log.info("Đã trừ {} {} ({}). Tồn kho còn: {}", 
                        usage.getQuantity(), part.getName(), part.getPartCode(), newStock);
                }
            }, () -> {
                log.error("LỖI: Không tìm thấy phụ tùng có ID {} để trừ kho cho phiếu {}", 
                    usage.getPartId(), event.getOrderNumber());
            });
        }
        
        log.info("Hoàn tất trừ kho cho phiếu: {}", event.getOrderNumber());
    }
}
