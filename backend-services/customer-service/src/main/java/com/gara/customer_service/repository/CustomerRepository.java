package com.gara.customer_service.repository;

import com.gara.customer_service.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByPhoneNumber(String phoneNumber);
    Optional<Customer> findByUserId(Long userId);

    @Query("SELECT c FROM Customer c WHERE LOWER(c.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR c.phoneNumber LIKE CONCAT('%', :search, '%')")
    Page<Customer> searchCustomers(@Param("search") String search, Pageable pageable);
}
