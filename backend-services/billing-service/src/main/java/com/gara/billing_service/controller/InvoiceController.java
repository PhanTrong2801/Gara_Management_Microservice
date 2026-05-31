package com.gara.billing_service.controller;

import com.gara.billing_service.entity.Invoice;
import com.gara.billing_service.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        return ResponseEntity.ok(invoiceService.getAllInvoices());
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
