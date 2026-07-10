package com.gara.billing_service.repository;

import com.gara.billing_service.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    Optional<Invoice> findByRepairOrderNumber(String repairOrderNumber);
    Page<Invoice> findByCustomerId(Long customerId, Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(i.repairOrderNumber) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Invoice> searchInvoices(@Param("keyword") String keyword, Pageable pageable);
}
