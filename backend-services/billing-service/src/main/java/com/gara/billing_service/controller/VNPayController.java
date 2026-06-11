package com.gara.billing_service.controller;

import com.gara.billing_service.config.VNPayConfig;
import com.gara.billing_service.entity.Invoice;
import com.gara.billing_service.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@RestController
@RequestMapping("/api/billing/vnpay")
@RequiredArgsConstructor
public class VNPayController {

    private final VNPayConfig vnPayConfig;
    private final InvoiceService invoiceService;

    @PostMapping("/create-payment")
    public ResponseEntity<Map<String, String>> createPayment(@RequestBody Map<String, String> payload) {
        String invoiceNumber = payload.get("invoiceNumber");
        Invoice invoice = invoiceService.getInvoiceByNumber(invoiceNumber);
        
        if (!"UNPAID".equals(invoice.getStatus())) {
            throw new RuntimeException("Hóa đơn đã được thanh toán hoặc đã hủy");
        }

        long amount = (long) (invoice.getTotalAmount() * 100); // VNPay yêu cầu nhân 100

        // Tạo thời gian theo múi giờ VN
        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("GMT+07:00"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(TimeZone.getTimeZone("GMT+07:00"));
        String vnp_CreateDate = formatter.format(cld.getTime());

        // Đặt tham số vào TreeMap (tự động sort theo key)
        Map<String, String> vnp_Params = new TreeMap<>();
        vnp_Params.put("vnp_Version", "2.1.0");
        vnp_Params.put("vnp_Command", "pay");
        vnp_Params.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        vnp_Params.put("vnp_Amount", String.valueOf(amount));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", invoiceNumber);
        vnp_Params.put("vnp_OrderInfo", "Thanh toan hoa don " + invoiceNumber);
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        vnp_Params.put("vnp_IpAddr", "127.0.0.1");
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        // Xây dựng chuỗi hashData và query cùng lúc, cả hai đều URLEncode
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<Map.Entry<String, String>> itr = vnp_Params.entrySet().iterator();
        
        while (itr.hasNext()) {
            Map.Entry<String, String> entry = itr.next();
            String fieldName = entry.getKey();
            String fieldValue = entry.getValue();
            
            if (fieldValue != null && fieldValue.length() > 0) {
                // hashData: URLEncode cả key và value
                hashData.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                
                // query: URLEncode cả key và value (giống hệt hashData)
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                
                if (itr.hasNext()) {
                    hashData.append('&');
                    query.append('&');
                }
            }
        }

        // Tạo chữ ký bảo mật
        String vnp_SecureHash = VNPayConfig.hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString());
        query.append("&vnp_SecureHash=").append(vnp_SecureHash);
        
        String paymentUrl = vnPayConfig.getPayUrl() + "?" + query.toString();

        Map<String, String> response = new HashMap<>();
        response.put("paymentUrl", paymentUrl);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/payment-return")
    public ResponseEntity<Map<String, String>> paymentReturn(@RequestBody Map<String, String> params) {
        String vnp_SecureHash = params.get("vnp_SecureHash");
        params.remove("vnp_SecureHash");
        params.remove("vnp_SecureHashType");

        // Rebuild hashData từ params (đã sort bằng TreeMap)
        Map<String, String> sortedParams = new TreeMap<>(params);
        StringBuilder hashData = new StringBuilder();
        Iterator<Map.Entry<String, String>> itr = sortedParams.entrySet().iterator();
        while (itr.hasNext()) {
            Map.Entry<String, String> entry = itr.next();
            if (entry.getValue() != null && entry.getValue().length() > 0) {
                hashData.append(URLEncoder.encode(entry.getKey(), StandardCharsets.US_ASCII));
                hashData.append('=');
                hashData.append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }
        
        String signValue = VNPayConfig.hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString());
        Map<String, String> result = new HashMap<>();

        if (signValue.equals(vnp_SecureHash)) {
            if ("00".equals(params.get("vnp_ResponseCode"))) {
                String txnRef = params.get("vnp_TxnRef");
                try {
                    invoiceService.payInvoice(txnRef, "VNPAY");
                    result.put("status", "SUCCESS");
                    result.put("message", "Thanh toán thành công");
                } catch (Exception e) {
                    result.put("status", "ERROR");
                    result.put("message", "Lỗi cập nhật CSDL");
                }
            } else {
                result.put("status", "FAILED");
                result.put("message", "Thanh toán thất bại tại cổng VNPay");
            }
        } else {
            result.put("status", "INVALID_SIGNATURE");
            result.put("message", "Sai chữ ký bảo mật");
        }
        return ResponseEntity.ok(result);
    }
}
