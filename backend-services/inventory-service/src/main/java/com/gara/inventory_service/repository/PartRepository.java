package com.gara.inventory_service.repository;

import com.gara.inventory_service.entity.Part;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;

@Repository
public interface PartRepository extends JpaRepository<Part, Long> {
    // Tự động sinh câu lệnh SQL: SELECT * FROM parts WHERE part_code = ?
    Optional<Part> findByPartCode(String partCode);

    @EntityGraph(attributePaths = {"supplier"})
    Page<Part> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"supplier"})
    @Query("SELECT p FROM Part p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.partCode) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Part> searchParts(@Param("search") String search, Pageable pageable);

    @EntityGraph(attributePaths = {"supplier"})
    @Query("SELECT p FROM Part p WHERE p.stockQuantity <= p.minStockLevel")
    Page<Part> findLowStockParts(Pageable pageable);
}
