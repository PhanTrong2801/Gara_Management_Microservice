package com.gara.repair_service.repository;

import com.gara.repair_service.entity.RepairOrder;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RepairOrderRepository extends MongoRepository<RepairOrder, String> {
    Optional<RepairOrder> findByOrderNumber(String orderNumber);
    List<RepairOrder> findByCustomerId(Long customerId);
}
