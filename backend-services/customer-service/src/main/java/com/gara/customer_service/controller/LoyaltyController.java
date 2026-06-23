package com.gara.customer_service.controller;

import com.gara.customer_service.dto.AddPointsRequest;
import com.gara.customer_service.dto.CustomerLoyaltyDto;
import com.gara.customer_service.dto.PointTransactionDto;
import com.gara.customer_service.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers/{customerId}/loyalty")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    @GetMapping
    public ResponseEntity<CustomerLoyaltyDto> getLoyaltyInfo(@PathVariable Long customerId) {
        return ResponseEntity.ok(loyaltyService.getLoyaltyInfo(customerId));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<PointTransactionDto>> getTransactions(@PathVariable Long customerId) {
        return ResponseEntity.ok(loyaltyService.getTransactions(customerId));
    }

    @PostMapping("/add")
    public ResponseEntity<CustomerLoyaltyDto> addPoints(
            @PathVariable Long customerId,
            @RequestBody AddPointsRequest request) {
        return ResponseEntity.ok(loyaltyService.addPointsFromSpent(customerId, request));
    }
}
