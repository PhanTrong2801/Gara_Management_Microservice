package com.gara.customer_service.service;

import com.gara.customer_service.dto.AddPointsRequest;
import com.gara.customer_service.dto.CustomerLoyaltyDto;
import com.gara.customer_service.dto.PointTransactionDto;
import com.gara.customer_service.entity.Customer;
import com.gara.customer_service.entity.CustomerLoyalty;
import com.gara.customer_service.entity.LoyaltySettings;
import com.gara.customer_service.entity.PointTransaction;
import com.gara.customer_service.entity.enums.Tier;
import com.gara.customer_service.entity.enums.TransactionType;
import com.gara.customer_service.repository.CustomerLoyaltyRepository;
import com.gara.customer_service.repository.CustomerRepository;
import com.gara.customer_service.repository.PointTransactionRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoyaltyService {

    private final CustomerLoyaltyRepository loyaltyRepository;
    private final PointTransactionRepository transactionRepository;
    private final CustomerRepository customerRepository;
    private final LoyaltySettingsService settingsService;

    public CustomerLoyaltyDto getLoyaltyInfo(Long customerId) {
        CustomerLoyalty loyalty = loyaltyRepository.findByCustomerId(customerId)
                .orElseGet(() -> createDefaultLoyalty(customerId));
        return mapToDto(loyalty);
    }

    @CacheEvict(value = { "customer_by_id", "customer_by_userid" }, allEntries = true)
    @Transactional
    public CustomerLoyaltyDto addPointsFromSpent(Long customerId, AddPointsRequest request) {
        CustomerLoyalty loyalty = loyaltyRepository.findByCustomerId(customerId)
                .orElseGet(() -> createDefaultLoyalty(customerId));

        LoyaltySettings settings = settingsService.getSettings();
        
        // Tính toán điểm dựa trên tỷ lệ quy đổi
        int pointsToAdd = (int) (request.getAmountSpent() / settings.getVndPerPoint());
        if (pointsToAdd <= 0) {
            return mapToDto(loyalty); // Không đủ để đổi 1 điểm
        }

        // Cập nhật điểm và tổng chi tiêu
        loyalty.setTotalPoints(loyalty.getTotalPoints() + pointsToAdd);
        loyalty.setTotalSpent(loyalty.getTotalSpent() + request.getAmountSpent());

        // Kiểm tra thăng hạng
        updateTier(loyalty, settings);

        loyaltyRepository.save(loyalty);

        // Lưu lịch sử
        PointTransaction transaction = new PointTransaction();
        transaction.setCustomer(loyalty.getCustomer());
        transaction.setPoints(pointsToAdd);
        transaction.setType(TransactionType.EARNED);
        transaction.setDescription(request.getDescription());
        transactionRepository.save(transaction);

        return mapToDto(loyalty);
    }

    public List<PointTransactionDto> getTransactions(Long customerId) {
        return transactionRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(this::mapToTransactionDto)
                .collect(Collectors.toList());
    }

    private CustomerLoyalty createDefaultLoyalty(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + customerId));
        CustomerLoyalty loyalty = new CustomerLoyalty();
        loyalty.setCustomer(customer);
        loyalty.setTotalPoints(0);
        loyalty.setTier(Tier.BRONZE);
        loyalty.setTotalSpent(0.0);
        return loyaltyRepository.save(loyalty);
    }

    private void updateTier(CustomerLoyalty loyalty, LoyaltySettings settings) {
        int points = loyalty.getTotalPoints();
        if (points >= settings.getPlatinumThreshold()) {
            loyalty.setTier(Tier.PLATINUM);
        } else if (points >= settings.getGoldThreshold()) {
            loyalty.setTier(Tier.GOLD);
        } else if (points >= settings.getSilverThreshold()) {
            loyalty.setTier(Tier.SILVER);
        } else {
            loyalty.setTier(Tier.BRONZE);
        }
    }

    private CustomerLoyaltyDto mapToDto(CustomerLoyalty loyalty) {
        CustomerLoyaltyDto dto = new CustomerLoyaltyDto();
        dto.setId(loyalty.getId());
        dto.setCustomerId(loyalty.getCustomer().getId());
        dto.setTotalPoints(loyalty.getTotalPoints());
        dto.setTier(loyalty.getTier());
        dto.setTotalSpent(loyalty.getTotalSpent());
        return dto;
    }

    private PointTransactionDto mapToTransactionDto(PointTransaction transaction) {
        PointTransactionDto dto = new PointTransactionDto();
        dto.setId(transaction.getId());
        dto.setCustomerId(transaction.getCustomer().getId());
        dto.setPoints(transaction.getPoints());
        dto.setType(transaction.getType());
        dto.setDescription(transaction.getDescription());
        dto.setCreatedAt(transaction.getCreatedAt());
        return dto;
    }
}
