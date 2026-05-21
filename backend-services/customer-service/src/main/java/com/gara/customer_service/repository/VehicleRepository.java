package com.gara.customer_service.repository;

import com.gara.customer_service.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    Optional<Vehicle> findByLicensePlate(String licensePlate);
}
