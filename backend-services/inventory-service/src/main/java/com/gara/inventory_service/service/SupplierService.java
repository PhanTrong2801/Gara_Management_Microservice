package com.gara.inventory_service.service;

import com.gara.inventory_service.entity.Supplier;
import com.gara.inventory_service.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;

    @CacheEvict(value = "supplier_by_id", allEntries = true)
    public Supplier createSupplier(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    public Page<Supplier> getAllSuppliers(String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return supplierRepository.searchSuppliers(search.trim(), pageable);
        }
        return supplierRepository.findAll(pageable);
    }

    @Cacheable(value = "supplier_by_id", key = "#id")
    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Nhà cung cấp với ID: " + id));
    }
}
