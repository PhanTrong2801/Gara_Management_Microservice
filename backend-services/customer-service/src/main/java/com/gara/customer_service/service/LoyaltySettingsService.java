package com.gara.customer_service.service;

import com.gara.customer_service.dto.LoyaltySettingsDto;
import com.gara.customer_service.entity.LoyaltySettings;
import com.gara.customer_service.repository.LoyaltySettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LoyaltySettingsService {

    private final LoyaltySettingsRepository loyaltySettingsRepository;

    public LoyaltySettings getSettings() {
        // Lấy bản ghi đầu tiên, nếu chưa có thì tạo mới (không set ID thủ công)
        return loyaltySettingsRepository.findAll().stream().findFirst().orElseGet(() -> {
            LoyaltySettings defaultSettings = new LoyaltySettings();
            return loyaltySettingsRepository.save(defaultSettings);
        });
    }

    @Transactional
    public LoyaltySettings updateSettings(LoyaltySettingsDto dto) {
        LoyaltySettings settings = getSettings();
        settings.setVndPerPoint(dto.getVndPerPoint());
        settings.setSilverThreshold(dto.getSilverThreshold());
        settings.setGoldThreshold(dto.getGoldThreshold());
        settings.setPlatinumThreshold(dto.getPlatinumThreshold());
        return loyaltySettingsRepository.save(settings);
    }
}
