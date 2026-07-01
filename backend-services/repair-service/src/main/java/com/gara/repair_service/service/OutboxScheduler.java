package com.gara.repair_service.service;

import com.gara.repair_service.entity.RepairOrder;
import com.gara.repair_service.repository.RepairOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxScheduler {

    private final RepairOrderRepository repairOrderRepository;
    private final RepairOrderService repairOrderService;

    @Scheduled(fixedDelay = 10000) // Quét mỗi 10 giây
    public void processPendingOutboxEvents() {
        // 1. Quét và gửi lại sự kiện trừ kho bị lỗi
        List<RepairOrder> pendingInventoryOrders = repairOrderRepository.findByStatusAndInventoryDeducted("COMPLETED", false);
        if (!pendingInventoryOrders.isEmpty()) {
            log.info("Tìm thấy {} đơn hàng chưa hoàn tất đồng bộ trừ kho. Tiến hành gửi lại...", pendingInventoryOrders.size());
            for (RepairOrder order : pendingInventoryOrders) {
                try {
                    repairOrderService.sendInventoryDeductEvent(order);
                    order.setInventoryDeducted(true);
                    repairOrderRepository.save(order);
                    log.info("Gửi lại sự kiện trừ kho thành công cho đơn: {}", order.getOrderNumber());
                } catch (Exception e) {
                    log.error("Gửi lại sự kiện trừ kho thất bại cho đơn: {}. Lỗi: {}", order.getOrderNumber(), e.getMessage());
                }
            }
        }

        // 2. Quét và gửi lại sự kiện thông báo khách hàng bị lỗi
        List<RepairOrder> pendingNotificationOrders = repairOrderRepository.findByStatusAndCustomerNotified("COMPLETED", false);
        if (!pendingNotificationOrders.isEmpty()) {
            log.info("Tìm thấy {} đơn hàng chưa hoàn tất thông báo khách hàng. Tiến hành gửi lại...", pendingNotificationOrders.size());
            for (RepairOrder order : pendingNotificationOrders) {
                try {
                    repairOrderService.sendCustomerNotificationEvent(order);
                    order.setCustomerNotified(true);
                    repairOrderRepository.save(order);
                    log.info("Gửi lại sự kiện thông báo thành công cho đơn: {}", order.getOrderNumber());
                } catch (Exception e) {
                    log.error("Gửi lại sự kiện thông báo thất bại cho đơn: {}. Lỗi: {}", order.getOrderNumber(), e.getMessage());
                }
            }
        }
    }
}
