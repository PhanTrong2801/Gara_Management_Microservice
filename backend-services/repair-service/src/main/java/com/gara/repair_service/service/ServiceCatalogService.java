package com.gara.repair_service.service;

import com.gara.repair_service.entity.ServiceCatalog;
import com.gara.repair_service.repository.ServiceCatalogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

@Service
@RequiredArgsConstructor
public class ServiceCatalogService {
    
    private final ServiceCatalogRepository serviceCatalogRepository;

    @Cacheable(value = "service_catalogs")
    public List<ServiceCatalog> getAllServices() {
        return serviceCatalogRepository.findAll();
    }

    public Page<ServiceCatalog> getAllServices(String keyword, Pageable pageable) {
        if (keyword == null || keyword.isBlank()) {
            return serviceCatalogRepository.findAll(pageable);
        }
        return serviceCatalogRepository.searchServiceCatalogs(keyword, pageable);
    }

    @CacheEvict(value = "service_catalogs", allEntries = true)
    public ServiceCatalog createService(ServiceCatalog serviceCatalog) {
        return serviceCatalogRepository.save(serviceCatalog);
    }

    @CacheEvict(value = "service_catalogs", allEntries = true)
    public ServiceCatalog updateService(String id, ServiceCatalog updatedService) {
        return serviceCatalogRepository.findById(id).map(service -> {
            service.setName(updatedService.getName());
            service.setDefaultCost(updatedService.getDefaultCost());
            service.setDescription(updatedService.getDescription());
            return serviceCatalogRepository.save(service);
        }).orElseThrow(() -> new RuntimeException("Service Catalog not found"));
    }

    @CacheEvict(value = "service_catalogs", allEntries = true)
    public void deleteService(String id) {
        serviceCatalogRepository.deleteById(id);
    }
}
