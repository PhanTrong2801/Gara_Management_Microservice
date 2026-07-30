package com.gara.billing_service.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceStatsDTO {
    private Double totalRevenue;
    private Long totalInvoices;
    private Long paidInvoices;
    private Long unpaidInvoices;
    private List<MonthlyRevenueDTO> monthlyRevenues;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyRevenueDTO {
        private String month;
        private Double revenue;
    }
}
