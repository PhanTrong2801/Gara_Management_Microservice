package com.gara.billing_service.repository;

import com.gara.billing_service.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    Optional<Invoice> findByRepairOrderNumber(String repairOrderNumber);
    Page<Invoice> findByCustomerId(Long customerId, Pageable pageable);

    @Query("SELECT i FROM Invoice i WHERE LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(i.repairOrderNumber) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Invoice> searchInvoices(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT SUM(i.totalAmount) FROM Invoice i WHERE i.status = 'PAID'")
    Double sumTotalRevenue();

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.status = :status")
    Long countByStatus(@Param("status") String status);
    
    // Bỏ qua native query theo tháng để tránh lỗi do khác biệt MySQL/PostgreSQL, 
    // ta sẽ fetch các hóa đơn PAID gần đây và group bằng Java trong Controller.
    @Query("SELECT i FROM Invoice i WHERE i.status = 'PAID' ORDER BY i.createdAt DESC")
    List<Invoice> findPaidInvoices();
}
