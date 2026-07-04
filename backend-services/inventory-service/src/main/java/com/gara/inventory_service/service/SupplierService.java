package com.gara.inventory_service.service;

import com.gara.inventory_service.entity.Supplier;
import com.gara.inventory_service.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public Supplier createSupplier(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    public Page<Supplier> getAllSuppliers(String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return supplierRepository.searchSuppliers(search.trim(), pageable);
        }
        return supplierRepository.findAll(pageable);
    }

    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Nhà cung cấp với ID: " + id));
    }
}
