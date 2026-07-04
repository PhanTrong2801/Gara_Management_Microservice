package com.gara.inventory_service.repository;

import com.gara.inventory_service.entity.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    Page<InventoryTransaction> findByPartIdOrderByTransactionDateDesc(Long partId, Pageable pageable);
}
