package com.gara.inventory_service.service;

import com.gara.inventory_service.dto.PurchaseOrderDTO;
import com.gara.inventory_service.entity.Part;
import com.gara.inventory_service.entity.PurchaseOrder;
import com.gara.inventory_service.entity.PurchaseOrderItem;
import com.gara.inventory_service.entity.Supplier;
import com.gara.inventory_service.repository.PartRepository;
import com.gara.inventory_service.repository.PurchaseOrderItemRepository;
import com.gara.inventory_service.repository.PurchaseOrderRepository;
import com.gara.inventory_service.repository.SupplierRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final SupplierRepository supplierRepository;
    private final PartRepository partRepository;
    private final PartService partService;

    @Transactional
    public PurchaseOrder createPurchaseOrder(PurchaseOrderDTO dto) {
        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Nhà cung cấp"));

        PurchaseOrder order = new PurchaseOrder();
        order.setSupplier(supplier);
        order.setOrderDate(LocalDateTime.now());
        order.setStatus("PENDING");

        double totalAmount = 0.0;
        PurchaseOrder savedOrder = purchaseOrderRepository.save(order);

        for (PurchaseOrderDTO.PurchaseOrderItemDTO itemDto : dto.getItems()) {
            Part part = partRepository.findById(itemDto.getPartId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy vật tư id: " + itemDto.getPartId()));

            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setPurchaseOrder(savedOrder);
            item.setPart(part);
            item.setQuantity(itemDto.getQuantity());
            item.setUnitPrice(itemDto.getUnitPrice());
            
            purchaseOrderItemRepository.save(item);

            totalAmount += (item.getQuantity() * item.getUnitPrice());
        }

        savedOrder.setTotalAmount(totalAmount);
        return purchaseOrderRepository.save(savedOrder);
    }

    public List<PurchaseOrder> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAll();
    }

    public PurchaseOrder getPurchaseOrderById(Long id) {
        return purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu nhập kho"));
    }

    public List<PurchaseOrderItem> getPurchaseOrderItems(Long orderId) {
        return purchaseOrderItemRepository.findByPurchaseOrderId(orderId);
    }

    @Transactional
    public PurchaseOrder completePurchaseOrder(Long id) {
        PurchaseOrder order = getPurchaseOrderById(id);
        
        if (!"PENDING".equals(order.getStatus())) {
            throw new RuntimeException("Phiếu nhập đã được xử lý (COMPLETED/CANCELLED)");
        }

        List<PurchaseOrderItem> items = purchaseOrderItemRepository.findByPurchaseOrderId(id);

        for (PurchaseOrderItem item : items) {
            // Cộng dồn kho
            partService.updateStock(item.getPart().getId(), item.getQuantity(), "IMPORT_PO", "PO-" + order.getId());
        }

        order.setStatus("COMPLETED");
        return purchaseOrderRepository.save(order);
    }
}
