package com.gara.auth_service.repository;

import com.gara.auth_service.entity.EmployeeSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EmployeeScheduleRepository extends JpaRepository<EmployeeSchedule, Long> {
    List<EmployeeSchedule> findByWorkDateBetween(LocalDate startDate, LocalDate endDate);
    List<EmployeeSchedule> findByUserIdAndWorkDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
    List<EmployeeSchedule> findByStatus(String status);
    List<EmployeeSchedule> findByStatusAndWorkDateBetween(String status, LocalDate startDate, LocalDate endDate);
    List<EmployeeSchedule> findByUserIdAndWorkDate(Long userId, LocalDate workDate);
}
