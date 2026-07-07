package com.gara.auth_service.repository;

import com.gara.auth_service.entity.DailyShiftConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyShiftConfigRepository extends JpaRepository<DailyShiftConfig, Long> {
    Optional<DailyShiftConfig> findByShiftIdAndWorkDate(Long shiftId, LocalDate workDate);
    List<DailyShiftConfig> findByWorkDateBetween(LocalDate startDate, LocalDate endDate);
}
