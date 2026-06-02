package com.gara.billing_service.repository;

import com.gara.billing_service.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    Optional<Invoice> findByRepairOrderNumber(String repairOrderNumber);
    java.util.List<Invoice> findByCustomerId(Long customerId);
}
