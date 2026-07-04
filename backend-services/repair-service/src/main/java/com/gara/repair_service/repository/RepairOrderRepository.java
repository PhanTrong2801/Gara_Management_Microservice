package com.gara.repair_service.repository;

import com.gara.repair_service.entity.RepairOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RepairOrderRepository extends MongoRepository<RepairOrder, String> {
    Optional<RepairOrder> findByOrderNumber(String orderNumber);
    List<RepairOrder> findByCustomerId(Long customerId);
    List<RepairOrder> findByStatusAndInventoryDeducted(String status, boolean inventoryDeducted);
    List<RepairOrder> findByStatusAndCustomerNotified(String status, boolean customerNotified);

    @Query("{ '$or': [ " +
           "  { 'orderNumber': { '$regex': ?0, '$options': 'i' } }, " +
           "  { 'status': { '$regex': ?0, '$options': 'i' } } " +
           "] }")
    Page<RepairOrder> searchRepairOrders(String keyword, Pageable pageable);
}
