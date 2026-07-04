package com.gara.customer_service.controller;

import com.gara.customer_service.dto.CustomerDTO;
import com.gara.customer_service.dto.InternalCustomerDTO;
import com.gara.customer_service.dto.VehicleDTO;
import com.gara.customer_service.entity.Customer;
import com.gara.customer_service.entity.Vehicle;
import com.gara.customer_service.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping
    public ResponseEntity<Customer> createCustomer(@Valid @RequestBody CustomerDTO dto){
        return ResponseEntity.ok(customerService.createCustomer(dto));
    }

    @PostMapping("/internal")
    public ResponseEntity<Customer> createInternalCustomer(@RequestBody InternalCustomerDTO dto){
        return ResponseEntity.ok(customerService.createInternalCustomer(dto));
    }

    @GetMapping("/me")
    public ResponseEntity<Customer> getMyProfile(@RequestHeader(value = "X-User-Id", required = false) String userIdStr){
        if (userIdStr == null) {
            return ResponseEntity.status(401).build();
        }
        Long userId = Long.valueOf(userIdStr);
        return ResponseEntity.ok(customerService.getCustomerByUserId(userId));
    }

    @PutMapping("/me/fcm-token")
    public ResponseEntity<?> updateFcmToken(@RequestHeader(value = "X-User-Id", required = false) String userIdStr,
                                            @RequestParam String token){
        if (userIdStr == null) {
            return ResponseEntity.status(401).build();
        }
        Long userId = Long.valueOf(userIdStr);
        customerService.updateFcmToken(userId, token);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/fcm-token/{customerId}")
    public ResponseEntity<String> getFcmToken(@PathVariable Long customerId) {
        return ResponseEntity.ok(customerService.getFcmToken(customerId));
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
    public ResponseEntity<Page<Customer>> getAllCustomers(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(customerService.getAllCustomers(search, pageable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Customer> updateCustomer(@PathVariable Long id, @Valid @RequestBody CustomerDTO dto) {
        return ResponseEntity.ok(customerService.updateCustomer(id, dto));
    }
}

