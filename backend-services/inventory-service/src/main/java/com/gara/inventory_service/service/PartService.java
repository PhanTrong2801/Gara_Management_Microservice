package com.gara.inventory_service.service;

import com.gara.inventory_service.dto.PartDTO;
import com.gara.inventory_service.entity.Part;
import com.gara.inventory_service.repository.PartRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PartService {

    private final PartRepository partRepository;

    @Transactional
    public Part createPart(PartDTO dto){
        if (partRepository.findByPartCode(dto.getPartCode()).isPresent()){
            throw new RuntimeException("Mã phụ tùng này đã tồn tại trong hệ thống!");
        }
        Part part = new Part();
        part.setPartCode(dto.getPartCode());
        part.setName(dto.getName());
        part.setDescription(dto.getDescription());
        part.setPrice(dto.getPrice());
        part.setStockQuantity(dto.getStockQuantity());
        return partRepository.save(part);

    }

    public List<Part> getAllParts(){
        return partRepository.findAll();
    }

    public Part getPartById(Long id){
        return partRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phụ tùng với ID: " + id));
    }
    @Transactional
    public Part updateStock(Long id, int quantityChange){
        Part part = getPartById(id);
        int newStock = part.getStockQuantity()+ quantityChange;

        if (newStock < 0){
            throw new RuntimeException("Lỗi: Số lượng tồn kho (" + part.getStockQuantity() + ") không đủ để xuất!");
        }

        part.setStockQuantity(newStock);
        return partRepository.save(part);
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
