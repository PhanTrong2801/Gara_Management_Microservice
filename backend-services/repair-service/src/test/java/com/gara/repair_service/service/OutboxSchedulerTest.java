package com.gara.repair_service.service;

import com.gara.repair_service.entity.RepairOrder;
import com.gara.repair_service.repository.RepairOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class OutboxSchedulerTest {

    @InjectMocks
    private OutboxScheduler outboxScheduler;

    @Mock
    private RepairOrderRepository repairOrderRepository;

    @Mock
    private RepairOrderService repairOrderService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testProcessPendingOutboxEvents_Success() {
        RepairOrder order = new RepairOrder();
        order.setOrderNumber("RO-001");
        order.setStatus("COMPLETED");
        order.setInventoryDeducted(false);
        order.setCustomerNotified(false);

        List<RepairOrder> pendingInventory = new ArrayList<>();
        pendingInventory.add(order);

        List<RepairOrder> pendingNotifications = new ArrayList<>();
        pendingNotifications.add(order);

        when(repairOrderRepository.findByStatusAndInventoryDeducted("COMPLETED", false)).thenReturn(pendingInventory);
        when(repairOrderRepository.findByStatusAndCustomerNotified("COMPLETED", false)).thenReturn(pendingNotifications);

        outboxScheduler.processPendingOutboxEvents();

        // Check if both events were sent and repository saved the updated state twice
        verify(repairOrderService, times(1)).sendInventoryDeductEvent(order);
        verify(repairOrderService, times(1)).sendCustomerNotificationEvent(order);
        verify(repairOrderRepository, times(2)).save(order);
    }

    @Test
    public void testProcessPendingOutboxEvents_FailureDoesNotSave() {
        RepairOrder order = new RepairOrder();
        order.setOrderNumber("RO-002");
        order.setStatus("COMPLETED");
        order.setInventoryDeducted(false);
        order.setCustomerNotified(false);

        List<RepairOrder> pendingInventory = Collections.singletonList(order);

        when(repairOrderRepository.findByStatusAndInventoryDeducted("COMPLETED", false)).thenReturn(pendingInventory);
        when(repairOrderRepository.findByStatusAndCustomerNotified("COMPLETED", false)).thenReturn(Collections.emptyList());

        // Simulate RabbitMQ transmission error
        doThrow(new RuntimeException("Connection refused")).when(repairOrderService).sendInventoryDeductEvent(order);

        outboxScheduler.processPendingOutboxEvents();

        // Verify save was NOT called because event transmission failed
        verify(repairOrderService, times(1)).sendInventoryDeductEvent(order);
        verify(repairOrderRepository, never()).save(order);
    }
}
