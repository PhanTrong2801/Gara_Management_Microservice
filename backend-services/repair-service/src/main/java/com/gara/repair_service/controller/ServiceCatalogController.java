package com.gara.repair_service.controller;

import com.gara.repair_service.entity.ServiceCatalog;
import com.gara.repair_service.service.ServiceCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repair/service-catalog")
@RequiredArgsConstructor
public class ServiceCatalogController {

    private final ServiceCatalogService serviceCatalogService;

    @GetMapping
    public ResponseEntity<List<ServiceCatalog>> getAllServices() {
        return ResponseEntity.ok(serviceCatalogService.getAllServices());
    }

    @PostMapping
    public ResponseEntity<ServiceCatalog> createService(@RequestBody ServiceCatalog serviceCatalog) {
        return ResponseEntity.ok(serviceCatalogService.createService(serviceCatalog));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceCatalog> updateService(@PathVariable String id, @RequestBody ServiceCatalog serviceCatalog) {
        return ResponseEntity.ok(serviceCatalogService.updateService(id, serviceCatalog));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable String id) {
        serviceCatalogService.deleteService(id);
        return ResponseEntity.ok().build();
    }
}
