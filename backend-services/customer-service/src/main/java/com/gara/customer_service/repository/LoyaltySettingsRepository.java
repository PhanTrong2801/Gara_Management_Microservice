package com.gara.customer_service.repository;

import com.gara.customer_service.entity.LoyaltySettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoyaltySettingsRepository extends JpaRepository<LoyaltySettings, Long> {
}
