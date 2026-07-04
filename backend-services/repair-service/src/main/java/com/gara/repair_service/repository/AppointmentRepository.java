package com.gara.repair_service.repository;

import com.gara.repair_service.entity.Appointment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends MongoRepository<Appointment, String> {
    List<Appointment> findByCustomerId(Long customerId);

    @Query("{ '$or': [ " +
           "  { 'status': { '$regex': ?0, '$options': 'i' } }, " +
           "  { 'description': { '$regex': ?0, '$options': 'i' } } " +
           "] }")
    Page<Appointment> searchAppointments(String keyword, Pageable pageable);
}
