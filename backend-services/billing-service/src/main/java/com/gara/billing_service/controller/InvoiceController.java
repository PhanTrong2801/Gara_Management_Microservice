package com.gara.billing_service.controller;

import com.gara.billing_service.entity.Invoice;
import com.gara.billing_service.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping("/invoices")
    public ResponseEntity<Invoice> createInvoice(@RequestBody Map<String, String> payload) {
        String repairOrderNumber = payload.get("repairOrderNumber");
        return ResponseEntity.ok(invoiceService.createInvoiceFromRepairOrder(repairOrderNumber));
    }

    @GetMapping("/invoices")
    public ResponseEntity<Page<Invoice>> getAllInvoices(
            @RequestParam(required = false, defaultValue = "") String search,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(invoiceService.getAllInvoices(search, pageable));
    }

    @GetMapping("/invoices/customer/{customerId}")
    public ResponseEntity<Page<Invoice>> getInvoicesByCustomerId(
            @PathVariable Long customerId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(invoiceService.getInvoicesByCustomerId(customerId, pageable));
    }

    @GetMapping("/invoices/{invoiceNumber}")
    public ResponseEntity<Invoice> getInvoice(@PathVariable String invoiceNumber) {
        return ResponseEntity.ok(invoiceService.getInvoiceByNumber(invoiceNumber));
    }

    @PostMapping("/invoices/{invoiceNumber}/pay")
    public ResponseEntity<Invoice> payInvoice(
            @PathVariable String invoiceNumber,
            @RequestBody Map<String, String> payload) {
        String paymentMethod = payload.getOrDefault("paymentMethod", "CASH");
        return ResponseEntity.ok(invoiceService.payInvoice(invoiceNumber, paymentMethod));
    }
}
