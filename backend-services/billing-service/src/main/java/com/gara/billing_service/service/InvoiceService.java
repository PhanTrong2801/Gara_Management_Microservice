package com.gara.billing_service.service;

import com.gara.billing_service.entity.Invoice;
import com.gara.billing_service.entity.InvoiceItem;
import com.gara.billing_service.feign.RepairServiceClient;
import com.gara.billing_service.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final RepairServiceClient repairServiceClient;

    @Transactional
    public Invoice createInvoiceFromRepairOrder(String repairOrderNumber) {
        // Kiểm tra xem hóa đơn đã tồn tại chưa
        Optional<Invoice> existingInvoice = invoiceRepository.findByRepairOrderNumber(repairOrderNumber);
        if (existingInvoice.isPresent()) {
            return existingInvoice.get();
        }

        // 1. Gọi sang repair-service lấy chi tiết phiếu sửa chữa
        Map<String, Object> repairOrder = repairServiceClient.getRepairOrder(repairOrderNumber);
        if (repairOrder == null) {
            throw new RuntimeException("Không tìm thấy phiếu sửa chữa: " + repairOrderNumber);
        }

        // Lấy thông tin cơ bản
        Long customerId = repairOrder.get("customerId") != null ? Long.valueOf(repairOrder.get("customerId").toString()) : null;

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber("INV-" + System.currentTimeMillis());
        invoice.setRepairOrderNumber(repairOrderNumber);
        invoice.setCustomerId(customerId);
        invoice.setStatus("UNPAID");
        invoice.setCreatedAt(LocalDateTime.now());

        double totalLabor = 0.0;
        double totalParts = 0.0;

        // 2. Lấy danh sách tasks (tiền công)
        List<Map<String, Object>> tasks = (List<Map<String, Object>>) repairOrder.get("tasks");
        if (tasks != null) {
            for (Map<String, Object> task : tasks) {
                String name = (String) task.get("name");
                Double cost = task.get("cost") != null ? Double.valueOf(task.get("cost").toString()) : 0.0;

                InvoiceItem item = new InvoiceItem();
                item.setType("TASK");
                item.setDescription(name);
                item.setQuantity(1);
                item.setUnitPrice(cost);
                item.setTotalPrice(cost);

                invoice.addItem(item);
                totalLabor += cost;
            }
        }

        // 3. Lấy danh sách parts (phụ tùng)
        List<Map<String, Object>> parts = (List<Map<String, Object>>) repairOrder.get("parts");
        if (parts != null) {
            for (Map<String, Object> part : parts) {
                String name = (String) part.get("partName");
                Integer quantity = part.get("quantity") != null ? Integer.valueOf(part.get("quantity").toString()) : 0;
                Double price = part.get("unitPrice") != null ? Double.valueOf(part.get("unitPrice").toString()) : 0.0;
                Double total = quantity * price;

                InvoiceItem item = new InvoiceItem();
                item.setType("PART");
                item.setDescription(name);
                item.setQuantity(quantity);
                item.setUnitPrice(price);
                item.setTotalPrice(total);

                invoice.addItem(item);
                totalParts += total;
            }
        }

        invoice.setTotalLaborCost(totalLabor);
        invoice.setTotalPartCost(totalParts);
        invoice.setTotalAmount(totalLabor + totalParts);

        return invoiceRepository.save(invoice);
    }

    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    public Invoice getInvoiceByNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
    }

    @Transactional
    public Invoice payInvoice(String invoiceNumber, String paymentMethod) {
        Invoice invoice = getInvoiceByNumber(invoiceNumber);
        if ("PAID".equals(invoice.getStatus())) {
            throw new RuntimeException("Hóa đơn đã được thanh toán");
        }
        invoice.setStatus("PAID");
        invoice.setPaymentMethod(paymentMethod);
        invoice.setPaidAt(LocalDateTime.now());
        return invoiceRepository.save(invoice);
    }
}
