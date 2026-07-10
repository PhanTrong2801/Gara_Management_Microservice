import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../api/api_service.dart';
import '../../models/invoice.dart';

class CustomerBillingScreen extends StatefulWidget {
  final int customerId;

  const CustomerBillingScreen({super.key, required this.customerId});

  @override
  State<CustomerBillingScreen> createState() => _CustomerBillingScreenState();
}

class _CustomerBillingScreenState extends State<CustomerBillingScreen> {
  List<InvoiceModel> _invoices = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchInvoices();
  }

  Future<void> _fetchInvoices() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await ApiService.get('/billing/invoices/customer/${widget.customerId}');
      print('[DEBUG] customer invoices response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final decoded = jsonDecode(utf8.decode(response.bodyBytes));
        List data = [];
        if (decoded is List) {
          data = decoded;
        } else if (decoded is Map && decoded.containsKey('content')) {
          data = decoded['content'] as List;
        }

        setState(() {
          _invoices = data.map((i) => InvoiceModel.fromJson(i)).toList();
          // Sắp xếp hóa đơn mới nhất lên đầu
          _invoices.sort((a, b) => b.id.compareTo(a.id));
        });
      }
    } catch (e) {
      print('[DEBUG] Error fetching invoices: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải hóa đơn: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _payOnline(InvoiceModel invoice) async {
    try {
      // 1. Gọi API tạo link thanh toán qua POST /billing/vnpay/create-payment
      final response = await ApiService.post(
        '/billing/vnpay/create-payment',
        {'invoiceNumber': invoice.invoiceNumber},
      );

      print('[DEBUG] create payment response status: ${response.statusCode}, body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final resData = jsonDecode(response.body);
        final paymentUrl = resData['paymentUrl'];

        if (paymentUrl != null && paymentUrl.isNotEmpty) {
          final uri = Uri.parse(paymentUrl);
          // 2. Mở trình duyệt ngoài
          if (await canLaunchUrl(uri)) {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          } else {
            // Nếu không tự động mở được, hiển thị dialog cho khách sao chép link
            _showCopyLinkDialog(paymentUrl);
          }
        } else {
          throw Exception('Không nhận được paymentUrl từ server.');
        }
      } else {
        throw Exception(invoice.status == 'PAID' ? 'Hóa đơn đã thanh toán!' : 'Lỗi từ server: ${response.body}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi thanh toán trực tuyến: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _showCopyLinkDialog(String url) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Thanh Toán Hóa Đơn'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Không thể mở trực tiếp trình duyệt. Bạn có thể sao chép liên kết thanh toán VNPay dưới đây để thanh toán:'),
              const SizedBox(height: 12),
              SelectableText(
                url,
                style: const TextStyle(color: Colors.blue, fontSize: 12),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Clipboard.setData(ClipboardData(text: url));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Đã sao chép liên kết vào bộ nhớ tạm!')),
                );
                Navigator.pop(context);
              },
              child: const Text('Sao chép'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Đóng'),
            ),
          ],
        );
      },
    );
  }

  void _showInvoiceDetails(InvoiceModel invoice) {
    final currencyFormatter = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0);

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(
            'Chi Tiết Hóa Đơn',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue.shade900),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildDetailRow('Mã hóa đơn', invoice.invoiceNumber, isBold: true),
              _buildDetailRow('Mã phiếu sửa', invoice.repairOrderNumber),
              const Divider(height: 24),
              _buildDetailRow('Tiền công thợ', currencyFormatter.format(invoice.totalLaborCost)),
              _buildDetailRow('Tiền phụ tùng', currencyFormatter.format(invoice.totalPartCost)),
              const Divider(height: 24),
              _buildDetailRow(
                'Tổng thanh toán',
                currencyFormatter.format(invoice.totalAmount),
                isBold: true,
                valueColor: Colors.orange.shade800,
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Trạng thái', style: TextStyle(fontWeight: FontWeight.w500)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: invoice.status == 'PAID' ? Colors.green.withValues(alpha: 0.1) : Colors.red.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      invoice.status == 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: invoice.status == 'PAID' ? Colors.green : Colors.red,
                      ),
                    ),
                  ),
                ],
              )
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Đóng'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isBold = false, Color? valueColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
              color: Colors.grey.shade600,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              color: valueColor ?? const Color(0xFF1E293B),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat.currency(locale: 'vi_VN', symbol: 'đ', decimalDigits: 0);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Quản lý hóa đơn'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.blue))
          : RefreshIndicator(
              onRefresh: _fetchInvoices,
              child: _invoices.isEmpty
                  ? ListView(
                      children: [
                        SizedBox(height: MediaQuery.of(context).size.height * 0.25),
                        const Icon(Icons.receipt_outlined, size: 64, color: Colors.grey),
                        const SizedBox(height: 12),
                        const Center(
                          child: Text(
                            'Bạn chưa có hóa đơn nào trong hệ thống.',
                            style: TextStyle(color: Colors.grey, fontSize: 16),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ],
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16.0),
                      itemCount: _invoices.length,
                      itemBuilder: (context, idx) {
                        final invoice = _invoices[idx];
                        final isPaid = invoice.status == 'PAID';

                        return Card(
                          elevation: 0,
                          margin: const EdgeInsets.only(bottom: 16),
                          color: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                            side: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(20.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        'Mã HĐ: ${invoice.invoiceNumber}',
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF1E293B),
                                        ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: isPaid ? Colors.green.withValues(alpha: 0.1) : Colors.red.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            isPaid ? Icons.check_circle : Icons.error_outline,
                                            size: 14,
                                            color: isPaid ? Colors.green : Colors.red,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            isPaid ? 'Đã thanh toán' : 'Chưa thanh toán',
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: isPaid ? Colors.green : Colors.red,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'Mã phiếu sửa chữa: ${invoice.repairOrderNumber}',
                                  style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  currencyFormatter.format(invoice.totalAmount),
                                  style: const TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.orange,
                                  ),
                                ),
                                const SizedBox(height: 16),
                                Row(
                                  children: [
                                    Expanded(
                                      child: OutlinedButton(
                                        onPressed: () => _showInvoiceDetails(invoice),
                                        style: OutlinedButton.styleFrom(
                                          side: const BorderSide(color: Color(0xFFCBD5E1)),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          padding: const EdgeInsets.symmetric(vertical: 12),
                                        ),
                                        child: const Text(
                                          'Xem chi tiết',
                                          style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF475569)),
                                        ),
                                      ),
                                    ),
                                    if (!isPaid) ...[
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: ElevatedButton.icon(
                                          onPressed: () => _payOnline(invoice),
                                          icon: const Icon(Icons.payment, size: 18),
                                          label: const Text('Thanh toán Online'),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.orange.shade700,
                                            foregroundColor: Colors.white,
                                            elevation: 0,
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(10),
                                            ),
                                            padding: const EdgeInsets.symmetric(vertical: 12),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                )
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
