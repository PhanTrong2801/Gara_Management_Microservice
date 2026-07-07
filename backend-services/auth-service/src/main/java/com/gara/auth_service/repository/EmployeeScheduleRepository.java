package com.gara.auth_service.repository;

import com.gara.auth_service.entity.EmployeeSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface EmployeeScheduleRepository extends JpaRepository<EmployeeSchedule, Long> {
    List<EmployeeSchedule> findByWorkDateBetween(LocalDate startDate, LocalDate endDate);
    List<EmployeeSchedule> findByUserIdAndWorkDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
    List<EmployeeSchedule> findByStatus(String status);
    List<EmployeeSchedule> findByStatusAndWorkDateBetween(String status, LocalDate startDate, LocalDate endDate);
    List<EmployeeSchedule> findByUserIdAndWorkDate(Long userId, LocalDate workDate);
    List<EmployeeSchedule> findByUserIdAndShiftIdAndWorkDate(Long userId, Long shiftId, LocalDate workDate);

    @Query("SELECT COUNT(es) FROM EmployeeSchedule es WHERE es.shift.id = :shiftId AND es.workDate = :workDate AND es.user.role.name = :roleName AND es.status != 'REJECTED'")
    int countByShiftIdAndWorkDateAndUserRoleName(
            @Param("shiftId") Long shiftId, 
            @Param("workDate") LocalDate workDate, 
            @Param("roleName") String roleName);
}
