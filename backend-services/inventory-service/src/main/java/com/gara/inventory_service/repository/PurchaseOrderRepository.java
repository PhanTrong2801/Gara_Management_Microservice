package com.gara.inventory_service.repository;

import com.gara.inventory_service.entity.PurchaseOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    @EntityGraph(attributePaths = {"supplier"})
    Page<PurchaseOrder> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"supplier"})
    @Query("SELECT po FROM PurchaseOrder po WHERE LOWER(po.supplier.name) LIKE LOWER(CONCAT('%', :search, '%')) OR CAST(po.id AS string) LIKE CONCAT('%', :search, '%')")
    Page<PurchaseOrder> searchPurchaseOrders(@Param("search") String search, Pageable pageable);
}
