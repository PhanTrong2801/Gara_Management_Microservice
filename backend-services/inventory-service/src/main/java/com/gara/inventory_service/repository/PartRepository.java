package com.gara.inventory_service.repository;

import com.gara.inventory_service.entity.Part;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PartRepository extends JpaRepository<Part, Long> {
    // Tự động sinh câu lệnh SQL: SELECT * FROM parts WHERE part_code = ?
    Optional<Part> findByPartCode(String partCode);
}
