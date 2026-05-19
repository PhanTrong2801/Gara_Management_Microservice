package com.gara.repair_service.service;

import com.gara.repair_service.entity.RepairOrder;
import com.gara.repair_service.repository.RepairOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RepairOrderService {

    private final RepairOrderRepository repairOrderRepository;

    public RepairOrder createRepairOrder(RepairOrder order, String creatorUsername){
        // Tự động sinh mã phiếu duy nhất: RO + Năm hiện tại + 8 ký tự mã ngẫu nhiên
        String year = String.valueOf(LocalDateTime.now().getYear());
        String shortUuid = UUID.randomUUID().toString().substring(0,8).toUpperCase();
        order.setOrderNumber("RO-" +year + "-"+shortUuid);

        // Mặc định xe mới vào xưởng sẽ ở trạng thái chờ chẩn đoán (PENDING)
        order.setStatus("PENDING");
        order.setCreatedAt(LocalDateTime.now());

        // Ghi nhận ID của người lập phiếu (Lễ tân) lấy từ ngữ cảnh đăng nhập
        // Trong thực tế bạn có thể thêm mảng logs để lưu vết lịch sử
        System.out.println("Phiếu được tạo bới nhân viên: "+ creatorUsername);

        return repairOrderRepository.save(order);
    }

    public RepairOrder getOrderDetails(String orderNumber){
        return repairOrderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(()-> new RuntimeException("Không tìm thấy phiếu sửa chữa yêu cầu "));
    }
}
