package com.gara.customer_service.controller;

import com.gara.customer_service.dto.LoyaltySettingsDto;
import com.gara.customer_service.entity.LoyaltySettings;
import com.gara.customer_service.service.LoyaltySettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers/loyalty-settings")
@RequiredArgsConstructor
public class LoyaltySettingsController {

    private final LoyaltySettingsService settingsService;

    @GetMapping
    public ResponseEntity<LoyaltySettings> getSettings() {
        return ResponseEntity.ok(settingsService.getSettings());
    }

    @PutMapping
    public ResponseEntity<LoyaltySettings> updateSettings(@RequestBody LoyaltySettingsDto dto) {
        return ResponseEntity.ok(settingsService.updateSettings(dto));
    }
}
