import 'dart:convert';
import 'package:flutter/material.dart';
import '../../api/api_service.dart';
import '../../models/repair_order.dart';

class RepairOrderDetailScreen extends StatefulWidget {
  final RepairOrderModel order;
  final VoidCallback onRefresh;

  const RepairOrderDetailScreen({
    super.key,
    required this.order,
    required this.onRefresh,
  });

  @override
  State<RepairOrderDetailScreen> createState() => _RepairOrderDetailScreenState();
}

class _RepairOrderDetailScreenState extends State<RepairOrderDetailScreen> {
  late RepairOrderModel _currentOrder;
  bool _isLoading = false;
  final Map<int, TextEditingController> _noteControllers = {};

  @override
  void initState() {
    super.initState();
    _currentOrder = widget.order;
    _initializeControllers();
  }

  void _initializeControllers() {
    for (var controller in _noteControllers.values) {
      controller.dispose();
    }
    _noteControllers.clear();
    for (int i = 0; i < _currentOrder.tasks.length; i++) {
      _noteControllers[i] = TextEditingController(text: _currentOrder.tasks[i].mechanicNote);
    }
  }

  @override
  void dispose() {
    for (var controller in _noteControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _fetchOrderDetails() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await ApiService.get('/repair/orders/${_currentOrder.orderNumber}');
      if (response.statusCode == 200) {
        setState(() {
          _currentOrder = RepairOrderModel.fromJson(jsonDecode(response.body));
          _initializeControllers();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải chi tiết phiếu: $e')),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _submitTaskUpdate(int index, String newStatus) async {
    setState(() {
      _isLoading = true;
    });

    final note = _noteControllers[index]?.text ?? '';

    try {
      final response = await ApiService.put(
        '/repair/orders/${_currentOrder.id}/tasks/$index',
        {
          'status': newStatus,
          'mechanicNote': note,
        },
      );

      print('[DEBUG] updateTask status: ${response.statusCode}, body: ${response.body}');

      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Cập nhật công việc thành công!'), backgroundColor: Colors.teal),
          );
        }
        await _fetchOrderDetails();
        widget.onRefresh();
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Lỗi: ${response.body}')),
          );
        }
      }
    } catch (e) {
      print('[DEBUG] Exception updateTask: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Không thể kết nối API: $e')),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _updateOrderStatus(String status) async {
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await ApiService.put(
        '/repair/orders/${_currentOrder.id}/status',
        {
          'status': status,
          'mechanicId': _currentOrder.mechanicId,
        },
      );

      print('[DEBUG] updateOrderStatus: ${response.statusCode}');

      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Đã cập nhật trạng thái thành ${_translateStatus(status)}!'), backgroundColor: Colors.teal),
          );
        }
        await _fetchOrderDetails();
        widget.onRefresh();
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Lỗi: ${response.body}')),
          );
        }
      }
    } catch (e) {
      print('[DEBUG] Exception updateOrderStatus: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Không thể kết nối API: $e')),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(_currentOrder.orderNumber),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
        actions: [
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)),
            )
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchOrderDetails,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Status Card
              Card(
                elevation: 0,
                color: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Trạng thái sửa chữa',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: _getStatusColor(_currentOrder.status).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              _translateStatus(_currentOrder.status),
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: _getStatusColor(_currentOrder.status),
                              ),
                            ),
                          ),
                          // Button to mark completed
                          if (_currentOrder.status == 'REPAIRING')
                            ElevatedButton.icon(
                              onPressed: () => _updateOrderStatus('COMPLETED'),
                              icon: const Icon(Icons.check_circle, size: 18),
                              label: const Text('Hoàn thành'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              const Text(
                'Danh sách công việc',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
              ),
              const SizedBox(height: 10),

              // Tasks List
              _currentOrder.tasks.isEmpty
                  ? Card(
                      elevation: 0,
                      color: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      child: const Padding(
                        padding: EdgeInsets.all(24.0),
                        child: Column(
                          children: [
                            Icon(Icons.inbox_outlined, size: 48, color: Colors.grey),
                            SizedBox(height: 8),
                            Text('Chưa phân công công việc cụ thể.', style: TextStyle(fontStyle: FontStyle.italic, color: Colors.grey)),
                          ],
                        ),
                      ),
                    )
                  : ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _currentOrder.tasks.length,
                      itemBuilder: (context, index) {
                        final task = _currentOrder.tasks[index];
                        final isDone = task.status == 'DONE';

                        return Card(
                          elevation: 0,
                          margin: const EdgeInsets.only(bottom: 12),
                          color: isDone ? const Color(0xFFF0FDF4) : Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(
                              color: isDone ? const Color(0xFFBBF7D0) : const Color(0xFFE2E8F0),
                            ),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        task.name,
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 15,
                                          decoration: isDone ? TextDecoration.lineThrough : null,
                                          color: isDone ? Colors.green.shade800 : const Color(0xFF1E293B),
                                        ),
                                      ),
                                    ),
                                    Checkbox(
                                      value: isDone,
                                      activeColor: Colors.teal,
                                      onChanged: (val) {
                                        if (val != null) {
                                          _submitTaskUpdate(index, val ? 'DONE' : 'PENDING');
                                        }
                                      },
                                    ),
                                  ],
                                ),
                                if (task.cost > 0)
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 8.0),
                                    child: Text(
                                      'Tiền công: ${task.cost.toStringAsFixed(0)}đ',
                                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                                    ),
                                  ),

                                // Note input field
                                TextFormField(
                                  controller: _noteControllers[index],
                                  decoration: InputDecoration(
                                    labelText: 'Ghi chú sửa chữa của thợ',
                                    labelStyle: const TextStyle(fontSize: 12),
                                    border: const UnderlineInputBorder(),
                                    suffixIcon: IconButton(
                                      icon: const Icon(Icons.check, size: 18, color: Colors.teal),
                                      onPressed: () => _submitTaskUpdate(index, task.status),
                                    ),
                                  ),
                                  style: const TextStyle(fontSize: 13),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PENDING':
        return Colors.orange;
      case 'DIAGNOSING':
        return Colors.blue;
      case 'QUOTING':
        return Colors.purple;
      case 'REPAIRING':
        return Colors.teal;
      case 'COMPLETED':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  String _translateStatus(String status) {
    switch (status) {
      case 'PENDING':
        return 'Chờ nhận xe';
      case 'DIAGNOSING':
        return 'Đang chẩn đoán';
      case 'QUOTING':
        return 'Đang báo giá';
      case 'REPAIRING':
        return 'Đang sửa chữa';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      default:
        return status;
    }
  }
}
