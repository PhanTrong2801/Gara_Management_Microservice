package com.gara.inventory_service.service;

import com.gara.inventory_service.dto.InventoryTransactionDTO;
import com.gara.inventory_service.entity.InventoryTransaction;
import com.gara.inventory_service.entity.Part;
import com.gara.inventory_service.repository.InventoryTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class InventoryTransactionService {

    private final InventoryTransactionRepository transactionRepository;

    public void recordTransaction(Part part, String type, int quantity, String reference) {
        InventoryTransaction transaction = new InventoryTransaction();
        transaction.setPart(part);
        transaction.setTransactionType(type);
        transaction.setQuantity(quantity);
        transaction.setReference(reference);
        transaction.setTransactionDate(LocalDateTime.now());
        transactionRepository.save(transaction);
    }

    public Page<InventoryTransactionDTO> getTransactionsByPartId(Long partId, Pageable pageable) {
        return transactionRepository.findByPartIdOrderByTransactionDateDesc(partId, pageable)
                .map(this::mapToDTO);
    }

    private InventoryTransactionDTO mapToDTO(InventoryTransaction entity) {
        InventoryTransactionDTO dto = new InventoryTransactionDTO();
        dto.setId(entity.getId());
        dto.setPartId(entity.getPart().getId());
        dto.setTransactionType(entity.getTransactionType());
        dto.setQuantity(entity.getQuantity());
        dto.setReference(entity.getReference());
        dto.setTransactionDate(entity.getTransactionDate());
        return dto;
    }
}
