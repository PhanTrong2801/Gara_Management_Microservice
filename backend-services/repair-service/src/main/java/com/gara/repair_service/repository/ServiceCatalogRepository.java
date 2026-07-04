package com.gara.repair_service.repository;

import com.gara.repair_service.entity.ServiceCatalog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceCatalogRepository extends MongoRepository<ServiceCatalog, String> {

    @Query("{ '$or': [ " +
           "  { 'name': { '$regex': ?0, '$options': 'i' } }, " +
           "  { 'description': { '$regex': ?0, '$options': 'i' } } " +
           "] }")
    Page<ServiceCatalog> searchServiceCatalogs(String keyword, Pageable pageable);
}
