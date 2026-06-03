package com.gara.repair_service.service;

import com.gara.repair_service.entity.ServiceCatalog;
import com.gara.repair_service.repository.ServiceCatalogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceCatalogService {
    
    private final ServiceCatalogRepository serviceCatalogRepository;

    public List<ServiceCatalog> getAllServices() {
        return serviceCatalogRepository.findAll();
    }

    public ServiceCatalog createService(ServiceCatalog serviceCatalog) {
        return serviceCatalogRepository.save(serviceCatalog);
    }

    public ServiceCatalog updateService(String id, ServiceCatalog updatedService) {
        return serviceCatalogRepository.findById(id).map(service -> {
            service.setName(updatedService.getName());
            service.setDefaultCost(updatedService.getDefaultCost());
            service.setDescription(updatedService.getDescription());
            return serviceCatalogRepository.save(service);
        }).orElseThrow(() -> new RuntimeException("Service Catalog not found"));
    }

    public void deleteService(String id) {
        serviceCatalogRepository.deleteById(id);
    }
}
