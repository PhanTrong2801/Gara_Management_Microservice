package com.gara.customer_service.service;

import com.gara.customer_service.dto.CustomerDTO;
import com.gara.customer_service.dto.InternalCustomerDTO;
import com.gara.customer_service.dto.VehicleDTO;
import com.gara.customer_service.entity.Customer;
import com.gara.customer_service.entity.Vehicle;
import com.gara.customer_service.repository.CustomerRepository;
import com.gara.customer_service.repository.VehicleRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;

    // 1. Đăng ký khách hàng mới
    @Transactional
    public Customer createCustomer(CustomerDTO dto){
        if (customerRepository.findByPhoneNumber(dto.getPhoneNumber()).isPresent()){
            throw new RuntimeException("Số điện thoại này đã tồn tại trong hệ thống!");
        }
        Customer customer = new Customer();
        customer.setFullName(dto.getFullName());
        customer.setPhoneNumber(dto.getPhoneNumber());
        customer.setEmail(dto.getEmail());
        customer.setAddress(dto.getAddress());

        return customerRepository.save(customer);

    }

    @Transactional
    public Customer createInternalCustomer(InternalCustomerDTO dto) {
        if (dto.getPhoneNumber() != null && customerRepository.findByPhoneNumber(dto.getPhoneNumber()).isPresent()){
            throw new RuntimeException("Số điện thoại này đã tồn tại trong hệ thống!");
        }
        if (dto.getUserId() != null && customerRepository.findByUserId(dto.getUserId()).isPresent()){
            throw new RuntimeException("UserId này đã được đăng ký!");
        }
        
        Customer customer = new Customer();
        customer.setFullName(dto.getFullName());
        customer.setPhoneNumber(dto.getPhoneNumber() != null ? dto.getPhoneNumber() : "N/A");
        customer.setEmail(dto.getEmail());
        customer.setUserId(dto.getUserId());
        
        return customerRepository.save(customer);
    }

    // 2. Thêm xe vào tài khoản khách hàng có sẵn
    @Transactional
    public Vehicle addVehicle(VehicleDTO dto) {
        Customer customer = customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng sở hữu có ID: " + dto.getCustomerId()));

        if (vehicleRepository.findByLicensePlate(dto.getLicensePlate()).isPresent()) {
            throw new RuntimeException("Biển số xe này đã được đăng ký trước đó!");
        }

        Vehicle vehicle = new Vehicle();
        vehicle.setLicensePlate(dto.getLicensePlate());
        vehicle.setVin(dto.getVin());
        vehicle.setBrand(dto.getBrand());
        vehicle.setModel(dto.getModel());
        vehicle.setYear(dto.getYear());
        vehicle.setCustomer(customer); // Thiết lập mối quan hệ N-1

        return vehicleRepository.save(vehicle);
    }


    // 3. Lấy thông tin chi tiết khách hàng (Bao gồm danh sách xe của họ)
    public Customer getCustomerById(Long id){
        return customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng sở hữu có ID: "+id));
    }

    public Customer getCustomerByUserId(Long userId){
        return customerRepository.findByUserId(userId)
                .orElseGet(() -> {
                    // Tự động tạo profile rỗng nếu user tồn tại bên Auth mà bên Customer bị mất data (Data Sync Issue)
                    Customer newCust = new Customer();
                    newCust.setUserId(userId);
                    newCust.setFullName("Người dùng mới");
                    newCust.setPhoneNumber("N/A");
                    newCust.setEmail("N/A");
                    return customerRepository.save(newCust);
                });
    }

    // 4. Lấy tất cả khách hàng
    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    @Transactional
    public Customer updateCustomer(Long id, CustomerDTO dto) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng"));

        customer.setFullName(dto.getFullName());
        customer.setPhoneNumber(dto.getPhoneNumber());
        customer.setEmail(dto.getEmail());
        customer.setAddress(dto.getAddress());

        return customerRepository.save(customer);
    }
}
