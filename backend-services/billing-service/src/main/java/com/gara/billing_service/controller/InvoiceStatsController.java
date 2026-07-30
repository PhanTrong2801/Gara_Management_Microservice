package com.gara.billing_service.controller;

import com.gara.billing_service.dto.InvoiceStatsDTO;
import com.gara.billing_service.entity.Invoice;
import com.gara.billing_service.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/billing/invoices/stats")
@RequiredArgsConstructor
public class InvoiceStatsController {

    private final InvoiceRepository invoiceRepository;

    @GetMapping
    public ResponseEntity<InvoiceStatsDTO> getInvoiceStats() {
        Double totalRev = invoiceRepository.sumTotalRevenue();
        if (totalRev == null) totalRev = 0.0;

        Long total = invoiceRepository.count();
        Long paid = invoiceRepository.countByStatus("PAID");
        Long unpaid = invoiceRepository.countByStatus("UNPAID");

        List<Invoice> paidInvoices = invoiceRepository.findPaidInvoices();

        // Calculate revenue for the last 6 months
        Map<String, Double> monthlyMap = new LinkedHashMap<>();
        YearMonth currentMonth = YearMonth.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/yyyy");

        for (int i = 5; i >= 0; i--) {
            monthlyMap.put(currentMonth.minusMonths(i).format(formatter), 0.0);
        }

        for (Invoice inv : paidInvoices) {
            LocalDateTime createdAt = inv.getCreatedAt();
            if (createdAt != null) {
                String monthKey = YearMonth.from(createdAt).format(formatter);
                if (monthlyMap.containsKey(monthKey)) {
                    monthlyMap.put(monthKey, monthlyMap.get(monthKey) + (inv.getTotalAmount() != null ? inv.getTotalAmount() : 0.0));
                }
            }
        }

        List<InvoiceStatsDTO.MonthlyRevenueDTO> monthlyRevenues = monthlyMap.entrySet().stream()
                .map(e -> new InvoiceStatsDTO.MonthlyRevenueDTO(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        InvoiceStatsDTO stats = new InvoiceStatsDTO(totalRev, total, paid, unpaid, monthlyRevenues);
        return ResponseEntity.ok(stats);
    }
}
