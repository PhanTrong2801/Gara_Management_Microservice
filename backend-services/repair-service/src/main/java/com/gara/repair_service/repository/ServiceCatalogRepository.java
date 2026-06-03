package com.gara.repair_service.repository;

import com.gara.repair_service.entity.ServiceCatalog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceCatalogRepository extends MongoRepository<ServiceCatalog, String> {
}
