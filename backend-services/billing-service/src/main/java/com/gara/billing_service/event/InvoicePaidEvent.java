package com.gara.billing_service.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoicePaidEvent {
    private Long customerId;
    private Double amountPaid;
    private String invoiceCode;
}
