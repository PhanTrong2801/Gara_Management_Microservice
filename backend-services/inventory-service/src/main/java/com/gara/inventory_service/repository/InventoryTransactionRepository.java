package com.gara.inventory_service.repository;

import com.gara.inventory_service.entity.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    List<InventoryTransaction> findByPartIdOrderByTransactionDateDesc(Long partId);
}
