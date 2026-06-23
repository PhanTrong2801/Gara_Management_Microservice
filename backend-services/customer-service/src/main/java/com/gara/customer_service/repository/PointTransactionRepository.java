package com.gara.customer_service.repository;

import com.gara.customer_service.entity.PointTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {
    List<PointTransaction> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
