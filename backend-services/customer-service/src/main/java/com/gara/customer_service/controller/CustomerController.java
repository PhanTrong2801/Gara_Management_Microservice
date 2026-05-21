package com.gara.customer_service.controller;

import com.gara.customer_service.dto.CustomerDTO;
import com.gara.customer_service.dto.VehicleDTO;
import com.gara.customer_service.entity.Customer;
import com.gara.customer_service.entity.Vehicle;
import com.gara.customer_service.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping
    public ResponseEntity<Customer> createCustomer(@Valid @RequestBody CustomerDTO dto){
        return ResponseEntity.ok(customerService.createCustomer(dto));
    }

    @PostMapping("/vehicles")
    public ResponseEntity<Vehicle> addVehicle(@Valid @RequestBody VehicleDTO dto){
        return ResponseEntity.ok(customerService.addVehicle(dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return ResponseEntity.ok(customerService.getAllCustomers());
    }
}

