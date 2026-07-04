package com.gara.inventory_service.service;

import com.gara.inventory_service.dto.PartDTO;
import com.gara.inventory_service.entity.Part;
import com.gara.inventory_service.repository.PartRepository;
import com.gara.inventory_service.entity.Supplier;
import com.gara.inventory_service.repository.SupplierRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class PartService {

    private final PartRepository partRepository;
    private final SupplierRepository supplierRepository;
    private final InventoryTransactionService transactionService;

    @Transactional
    public Part createPart(PartDTO dto){
        if (partRepository.findByPartCode(dto.getPartCode()).isPresent()){
            throw new RuntimeException("Mã phụ tùng này đã tồn tại trong hệ thống!");
        }

        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Nhà cung cấp với ID: " + dto.getSupplierId()));

        Part part = new Part();
        part.setPartCode(dto.getPartCode());
        part.setName(dto.getName());
        part.setDescription(dto.getDescription());
        part.setPrice(dto.getPrice());
        part.setStockQuantity(dto.getStockQuantity());
        part.setSupplier(supplier);
        
        if (dto.getMinStockLevel() != null) {
            part.setMinStockLevel(dto.getMinStockLevel());
        }
        return partRepository.save(part);

    }

    @Transactional
    public Part updatePart(Long id, PartDTO dto) {
        Part part = getPartById(id);

        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Nhà cung cấp với ID: " + dto.getSupplierId()));

        // Lưu ý: KHÔNG cho phép cập nhật partCode (SKU) và stockQuantity qua form Sửa
        part.setName(dto.getName());
        part.setDescription(dto.getDescription());
        part.setPrice(dto.getPrice());
        part.setSupplier(supplier);
        
        if (dto.getMinStockLevel() != null) {
            part.setMinStockLevel(dto.getMinStockLevel());
        }
        return partRepository.save(part);
    }

    @Transactional
    public void deletePart(Long id) {
        Part part = getPartById(id);
        try {
            partRepository.delete(part);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new RuntimeException("Không thể xóa phụ tùng này vì đã phát sinh giao dịch nhập/xuất kho liên quan!");
        }
    }

    public Page<Part> getAllParts(String search, Pageable pageable){
        if (search != null && !search.trim().isEmpty()) {
            return partRepository.searchParts(search.trim(), pageable);
        }
        return partRepository.findAll(pageable);
    }

    public Page<Part> getLowStockParts(Pageable pageable) {
        return partRepository.findLowStockParts(pageable);
    }

    public Part getPartById(Long id){
        return partRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phụ tùng với ID: " + id));
    }
    @Transactional
    public Part updateStock(Long id, int quantityChange, String transactionType, String reference){
        Part part = getPartById(id);
        int newStock = part.getStockQuantity()+ quantityChange;

        if (newStock < 0){
            throw new RuntimeException("Lỗi: Số lượng tồn kho (" + part.getStockQuantity() + ") không đủ để xuất!");
        }

        part.setStockQuantity(newStock);
        Part savedPart = partRepository.save(part);
        transactionService.recordTransaction(savedPart, transactionType, quantityChange, reference);
        return savedPart;
    }

    public void checkStock(com.gara.inventory_service.dto.StockCheckRequest request) {
        for (com.gara.inventory_service.dto.StockCheckRequest.PartRequest pr : request.getParts()) {
            Part part = getPartById(pr.getPartId());
            if (part.getStockQuantity() < pr.getQuantity()) {
                throw new RuntimeException("Phụ tùng '" + part.getName() + "' (Mã: " + part.getPartCode() + ") không đủ tồn kho. Yêu cầu: " + pr.getQuantity() + ", Hiện có: " + part.getStockQuantity());
            }
        }
    }
}
