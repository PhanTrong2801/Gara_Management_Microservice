package com.gara.inventory_service.repository;

import com.gara.inventory_service.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    @Query("SELECT s FROM Supplier s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) OR s.contactPhone LIKE CONCAT('%', :search, '%')")
    Page<Supplier> searchSuppliers(@Param("search") String search, Pageable pageable);
}
