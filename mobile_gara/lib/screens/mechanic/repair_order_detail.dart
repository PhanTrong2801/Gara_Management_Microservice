import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:signature/signature.dart';
import 'dart:typed_data';
import '../../api/api_service.dart';
import '../../models/repair_order.dart';
import '../../providers/auth_provider.dart';

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

  // Local state for editing details
  List<RepairTaskModel> _localTasks = [];
  List<RepairPartModel> _localParts = [];

  @override
  void initState() {
    super.initState();
    _currentOrder = widget.order;
    _localTasks = List.from(_currentOrder.tasks);
    _localParts = List.from(_currentOrder.parts);
    _initializeControllers();
  }

  void _initializeControllers() {
    for (var controller in _noteControllers.values) {
      controller.dispose();
    }
    _noteControllers.clear();
    for (int i = 0; i < _localTasks.length; i++) {
      _noteControllers[i] = TextEditingController(text: _localTasks[i].mechanicNote);
    }
  }

  @override
  void dispose() {
    for (var controller in _noteControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  bool get _isModified {
    if (_localTasks.length != _currentOrder.tasks.length || _localParts.length != _currentOrder.parts.length) {
      return true;
    }
    for (int i = 0; i < _localTasks.length; i++) {
      if (_localTasks[i].serviceCatalogId != _currentOrder.tasks[i].serviceCatalogId ||
          _localTasks[i].name != _currentOrder.tasks[i].name ||
          _localTasks[i].cost != _currentOrder.tasks[i].cost) {
        return true;
      }
    }
    for (int i = 0; i < _localParts.length; i++) {
      if (_localParts[i].partId != _currentOrder.parts[i].partId ||
          _localParts[i].quantity != _currentOrder.parts[i].quantity ||
          _localParts[i].unitPrice != _currentOrder.parts[i].unitPrice) {
        return true;
      }
    }
    return false;
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
          _localTasks = List.from(_currentOrder.tasks);
          _localParts = List.from(_currentOrder.parts);
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

  Future<void> _approveOrder(Uint8List signatureBytes) async {
    setState(() { _isLoading = true; });
    try {
      final base64Signature = base64Encode(signatureBytes);
      final response = await ApiService.put(
        '/repair/orders/${_currentOrder.id}/approve',
        {'signatureBase64': base64Signature},
      );
      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Khách hàng ký xác nhận thành công!'), backgroundColor: Colors.green),
          );
        }
        await _fetchOrderDetails();
        widget.onRefresh();
      } else {
        throw Exception(response.body);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi xác nhận: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      setState(() { _isLoading = false; });
    }
  }

  void _showSignatureDialog() {
    final SignatureController signatureController = SignatureController(
      penStrokeWidth: 3,
      penColor: Colors.black,
      exportBackgroundColor: Colors.white,
    );

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Khách hàng ký trực tiếp', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Đưa máy cho khách hàng ký vào khung bên dưới để chốt báo giá.'),
            const SizedBox(height: 12),
            Container(
              width: 300,
              height: 150,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade400),
                borderRadius: BorderRadius.circular(8),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Signature(
                  controller: signatureController,
                  width: 300,
                  height: 150,
                  backgroundColor: Colors.grey.shade100,
                ),
              ),
            ),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => signatureController.clear(),
                child: const Text('Xóa chữ ký', style: TextStyle(color: Colors.red)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (signatureController.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Vui lòng ký tên trước khi xác nhận.')),
                );
                return;
              }
              final signatureBytes = await signatureController.toPngBytes();
              if (signatureBytes != null) {
                Navigator.pop(context); // Đóng dialog
                _approveOrder(signatureBytes);
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.blueAccent, foregroundColor: Colors.white),
            child: const Text('Xác nhận chữ ký'),
          ),
        ],
      ),
    );
  }

  Future<void> _generateInvoice() async {
    setState(() { _isLoading = true; });
    try {
      final response = await ApiService.post(
        '/billing/invoices',
        {'repairOrderNumber': _currentOrder.orderNumber},
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Đã xuất hóa đơn thành công!'), backgroundColor: Colors.green),
          );
        }
      } else {
        throw Exception(response.body);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi xuất hóa đơn: Có thể hóa đơn đã được tạo hoặc xảy ra lỗi.'), backgroundColor: Colors.red),
        );
      }
    } finally {
      setState(() { _isLoading = false; });
    }
  }

  Future<void> _submitTaskNote(int index) async {
    setState(() {
      _isLoading = true;
    });

    final note = _noteControllers[index]?.text ?? '';
    final task = _localTasks[index];

    try {
      final response = await ApiService.put(
        '/repair/orders/${_currentOrder.id}/tasks/$index',
        {
          'status': task.status,
          'mechanicNote': note,
        },
      );

      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Cập nhật ghi chú thợ thành công!'), backgroundColor: Colors.teal),
          );
        }
        await _fetchOrderDetails();
        widget.onRefresh();
      } else {
        throw Exception(response.body);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi cập nhật ghi chú: $e')),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _submitTaskStatus(int index, String newStatus) async {
    // If not saved, we can toggle status locally, or if saved, update directly
    if (_isModified) {
      setState(() {
        _localTasks[index] = RepairTaskModel(
          serviceCatalogId: _localTasks[index].serviceCatalogId,
          name: _localTasks[index].name,
          cost: _localTasks[index].cost,
          mechanicId: _localTasks[index].mechanicId,
          status: newStatus,
          mechanicNote: _noteControllers[index]?.text ?? '',
        );
      });
      return;
    }

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

      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Cập nhật trạng thái công việc thành công!'), backgroundColor: Colors.teal),
          );
        }
        await _fetchOrderDetails();
        widget.onRefresh();
      } else {
        throw Exception(response.body);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi: $e')),
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

      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Đã cập nhật trạng thái thành ${_translateStatus(status)}!'), backgroundColor: Colors.teal),
          );
        }
        await _fetchOrderDetails();
        widget.onRefresh();
      } else {
        throw Exception(response.body);
      }
    } catch (e) {
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

  Future<void> _saveDetails() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final payload = {
        'tasks': _localTasks.map((t) => {
          'serviceCatalogId': t.serviceCatalogId,
          'name': t.name,
          'cost': t.cost,
          'status': t.status,
          'mechanicNote': t.mechanicNote,
        }).toList(),
        'parts': _localParts.map((p) => {
          'partId': p.partId,
          'partName': p.partName,
          'quantity': p.quantity,
          'unitPrice': p.unitPrice,
        }).toList(),
      };

      final response = await ApiService.put('/repair/orders/${_currentOrder.id}/details', payload);
      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Cập nhật chi tiết phiếu sửa chữa thành công!'), backgroundColor: Colors.green),
          );
        }
        await _fetchOrderDetails();
        widget.onRefresh();
      } else {
        throw Exception(response.body);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi khi lưu chi tiết: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _showAddTaskDialog() async {
    List<CatalogServiceModel> availableServices = [];
    bool loadingSvc = true;
    CatalogServiceModel? selectedSvc;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            if (loadingSvc) {
              ApiService.get('/repair/service-catalog').then((res) {
                if (res.statusCode == 200) {
                  final List data = jsonDecode(res.body);
                  setDialogState(() {
                    availableServices = data.map((s) => CatalogServiceModel.fromJson(s)).toList();
                    loadingSvc = false;
                  });
                }
              }).catchError((e) {
                setDialogState(() {
                  loadingSvc = false;
                });
              });
            }

            return AlertDialog(
              title: const Text('Thêm Công Việc'),
              content: loadingSvc
                  ? const SizedBox(height: 100, child: Center(child: CircularProgressIndicator()))
                  : DropdownButtonFormField<CatalogServiceModel>(
                      initialValue: selectedSvc,
                      hint: const Text('Chọn dịch vụ/công việc...'),
                      isExpanded: true,
                      items: availableServices.map((s) {
                        return DropdownMenuItem(
                          value: s,
                          child: Text('${s.name} (${s.cost.toStringAsFixed(0)}đ)'),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setDialogState(() {
                          selectedSvc = val;
                        });
                      },
                    ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('Hủy')),
                ElevatedButton(
                  onPressed: selectedSvc == null
                      ? null
                      : () {
                          setState(() {
                            _localTasks.add(RepairTaskModel(
                              serviceCatalogId: selectedSvc!.id,
                              name: selectedSvc!.name,
                              cost: selectedSvc!.cost,
                              status: 'PENDING',
                              mechanicNote: '',
                            ));
                            _initializeControllers();
                          });
                          Navigator.pop(context);
                        },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white),
                  child: const Text('Thêm'),
                )
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _showAddPartDialog() async {
    List<CatalogPartModel> availableParts = [];
    bool loadingParts = true;
    CatalogPartModel? selectedPart;
    final qtyController = TextEditingController(text: '1');

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            if (loadingParts) {
              ApiService.get('/inventory/parts').then((res) {
                if (res.statusCode == 200) {
                  final List data = jsonDecode(res.body);
                  setDialogState(() {
                    availableParts = data.map((p) => CatalogPartModel.fromJson(p)).toList();
                    loadingParts = false;
                  });
                }
              }).catchError((e) {
                setDialogState(() {
                  loadingParts = false;
                });
              });
            }

            return AlertDialog(
              title: const Text('Thêm Phụ Tùng'),
              content: loadingParts
                  ? const SizedBox(height: 100, child: Center(child: CircularProgressIndicator()))
                  : Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        DropdownButtonFormField<CatalogPartModel>(
                          initialValue: selectedPart,
                          hint: const Text('Chọn phụ tùng...'),
                          isExpanded: true,
                          items: availableParts.map((p) {
                            return DropdownMenuItem(
                              value: p,
                              child: Text('${p.name} (${p.price.toStringAsFixed(0)}đ)'),
                            );
                          }).toList(),
                          onChanged: (val) {
                            setDialogState(() {
                              selectedPart = val;
                            });
                          },
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: qtyController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Số lượng'),
                        ),
                      ],
                    ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('Hủy')),
                ElevatedButton(
                  onPressed: selectedPart == null
                      ? null
                      : () {
                          final qty = int.tryParse(qtyController.text.trim()) ?? 1;
                          setState(() {
                            _localParts.add(RepairPartModel(
                              partId: selectedPart!.id,
                              partName: selectedPart!.name,
                              quantity: qty,
                              unitPrice: selectedPart!.price,
                            ));
                          });
                          Navigator.pop(context);
                        },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white),
                  child: const Text('Thêm'),
                )
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final isManager = auth.currentUser?.role == 'MANAGER' || auth.currentUser?.role == 'ROLE_MANAGER';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(_currentOrder.orderNumber, style: const TextStyle(fontWeight: FontWeight.bold)),
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
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          isManager
                              ? DropdownButton<String>(
                                  value: _currentOrder.status,
                                  items: ['PENDING', 'DIAGNOSING', 'QUOTING', 'APPROVED', 'REPAIRING', 'COMPLETED'].map((status) {
                                    return DropdownMenuItem<String>(
                                      value: status,
                                      child: Text(_translateStatus(status), style: const TextStyle(fontWeight: FontWeight.bold)),
                                    );
                                  }).toList(),
                                  onChanged: (val) {
                                    if (val != null && val != _currentOrder.status) {
                                      _updateOrderStatus(val);
                                    }
                                  },
                                )
                              : Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: _getStatusColor(_currentOrder.status).withValues(alpha: 0.1),
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
                          if (!isManager && _currentOrder.status == 'REPAIRING')
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
                      const SizedBox(height: 16),
                      if (isManager && _currentOrder.status == 'QUOTING' && !_currentOrder.customerApproved)
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: _showSignatureDialog,
                            icon: const Icon(Icons.draw),
                            label: const Text('Cho khách ký trực tiếp', style: TextStyle(fontWeight: FontWeight.bold)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.orange.shade600,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                      if (isManager && _currentOrder.status == 'COMPLETED')
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: _generateInvoice,
                            icon: const Icon(Icons.receipt_long),
                            label: const Text('Xuất hóa đơn thanh toán', style: TextStyle(fontWeight: FontWeight.bold)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.indigo.shade600,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                      if (isManager && _currentOrder.customerApproved) ...[
                        const Divider(height: 32),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            border: Border.all(color: Colors.green.shade300),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.check_circle, color: Colors.green),
                                  SizedBox(width: 8),
                                  Text('Khách đã xác nhận chữ ký số', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                                ],
                              ),
                              if (_currentOrder.customerSignatureBase64 != null)
                                Padding(
                                  padding: const EdgeInsets.only(top: 12.0),
                                  child: Container(
                                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
                                    child: Image.memory(
                                      base64Decode(_currentOrder.customerSignatureBase64!),
                                      height: 100,
                                      fit: BoxFit.contain,
                                    ),
                                  ),
                                )
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Tasks Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Danh sách công việc',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                  ),
                  if (isManager)
                    TextButton.icon(
                      onPressed: _showAddTaskDialog,
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('Thêm công'),
                      style: TextButton.styleFrom(foregroundColor: Colors.teal),
                    ),
                ],
              ),
              const SizedBox(height: 10),

              _localTasks.isEmpty
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
                      itemCount: _localTasks.length,
                      itemBuilder: (context, index) {
                        final task = _localTasks[index];
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
                                    if (isManager)
                                      IconButton(
                                        icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                                        onPressed: () {
                                          setState(() {
                                            _localTasks.removeAt(index);
                                            _initializeControllers();
                                          });
                                        },
                                      )
                                    else
                                      Checkbox(
                                        value: isDone,
                                        activeColor: Colors.teal,
                                        onChanged: (val) {
                                          if (val != null) {
                                            _submitTaskStatus(index, val ? 'DONE' : 'PENDING');
                                          }
                                        },
                                      ),
                                  ],
                                ),
                                if (isManager && task.cost > 0)
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 8.0),
                                    child: Text(
                                      'Tiền công: ${task.cost.toStringAsFixed(0)}đ',
                                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                                    ),
                                  ),
                                if (!isManager) ...[
                                  TextFormField(
                                    controller: _noteControllers[index],
                                    decoration: InputDecoration(
                                      labelText: 'Ghi chú sửa chữa của thợ',
                                      labelStyle: const TextStyle(fontSize: 12),
                                      border: const UnderlineInputBorder(),
                                      suffixIcon: IconButton(
                                        icon: const Icon(Icons.check, size: 18, color: Colors.teal),
                                        onPressed: () => _submitTaskNote(index),
                                      ),
                                    ),
                                    style: const TextStyle(fontSize: 13),
                                  ),
                                ]
                              ],
                            ),
                          ),
                        );
                      },
                    ),

              const SizedBox(height: 20),

              // Parts Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Phụ tùng thay thế',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                  ),
                  if (isManager)
                    TextButton.icon(
                      onPressed: _showAddPartDialog,
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('Thêm phụ tùng'),
                      style: TextButton.styleFrom(foregroundColor: Colors.teal),
                    ),
                ],
              ),
              const SizedBox(height: 10),

              _localParts.isEmpty
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
                            Icon(Icons.widgets_outlined, size: 48, color: Colors.grey),
                            SizedBox(height: 8),
                            Text('Chưa thay thế phụ tùng nào.', style: TextStyle(fontStyle: FontStyle.italic, color: Colors.grey)),
                          ],
                        ),
                      ),
                    )
                  : ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _localParts.length,
                      itemBuilder: (context, index) {
                        final part = _localParts[index];
                        final subtotal = part.unitPrice * part.quantity;

                        return Card(
                          elevation: 0,
                          margin: const EdgeInsets.only(bottom: 12),
                          color: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        part.partName,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1E293B)),
                                      ),
                                      if (isManager) ...[
                                        const SizedBox(height: 4),
                                        Text(
                                          'Đơn giá: ${part.unitPrice.toStringAsFixed(0)}đ x ${part.quantity}',
                                          style: const TextStyle(color: Colors.grey, fontSize: 13),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'Thành tiền: ${subtotal.toStringAsFixed(0)}đ',
                                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.teal.shade800),
                                        )
                                      ] else ...[
                                        const SizedBox(height: 4),
                                        Text(
                                          'Số lượng cần thay: ${part.quantity}',
                                          style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 13),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                                if (isManager) ...[
                                  Row(
                                    children: [
                                      IconButton(
                                        icon: const Icon(Icons.remove_circle_outline, color: Colors.teal),
                                        onPressed: () {
                                          if (part.quantity > 1) {
                                            setState(() {
                                              _localParts[index] = RepairPartModel(
                                                partId: part.partId,
                                                partName: part.partName,
                                                quantity: part.quantity - 1,
                                                unitPrice: part.unitPrice,
                                              );
                                            });
                                          }
                                        },
                                      ),
                                      Text('${part.quantity}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                      IconButton(
                                        icon: const Icon(Icons.add_circle_outline, color: Colors.teal),
                                        onPressed: () {
                                          setState(() {
                                            _localParts[index] = RepairPartModel(
                                              partId: part.partId,
                                              partName: part.partName,
                                              quantity: part.quantity + 1,
                                              unitPrice: part.unitPrice,
                                            );
                                          });
                                        },
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                                        onPressed: () {
                                          setState(() {
                                            _localParts.removeAt(index);
                                          });
                                        },
                                      ),
                                    ],
                                  ),
                                ]
                              ],
                            ),
                          ),
                        );
                      },
                    ),
              // Extra space for bottom bar
              if (_isModified) const SizedBox(height: 80),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _isModified
          ? Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -5))
                ],
              ),
              child: ElevatedButton.icon(
                onPressed: _saveDetails,
                icon: const Icon(Icons.save),
                label: const Text('Lưu thay đổi chi tiết', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.teal,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            )
          : null,
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
      case 'APPROVED':
        return Colors.lightBlue;
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
      case 'APPROVED':
        return 'Khách đã duyệt';
      case 'REPAIRING':
        return 'Đang sửa chữa';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      default:
        return status;
    }
  }
}

class CatalogServiceModel {
  final String id;
  final String name;
  final double cost;

  CatalogServiceModel({required this.id, required this.name, required this.cost});

  factory CatalogServiceModel.fromJson(Map<String, dynamic> json) {
    return CatalogServiceModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      cost: (json['defaultCost'] ?? 0.0).toDouble(),
    );
  }
}

class CatalogPartModel {
  final int id;
  final String name;
  final double price;

  CatalogPartModel({required this.id, required this.name, required this.price});

  factory CatalogPartModel.fromJson(Map<String, dynamic> json) {
    return CatalogPartModel(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      price: (json['price'] ?? 0.0).toDouble(),
    );
  }
}
