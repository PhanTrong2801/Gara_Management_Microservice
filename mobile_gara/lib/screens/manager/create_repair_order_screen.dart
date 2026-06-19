import 'dart:convert';
import 'package:flutter/material.dart';
import '../../api/api_service.dart';
import '../../models/customer.dart';

class CreateRepairOrderScreen extends StatefulWidget {
  final String? prefillPhone;
  final String? prefillDescription;

  const CreateRepairOrderScreen({
    super.key,
    this.prefillPhone,
    this.prefillDescription,
  });

  @override
  State<CreateRepairOrderScreen> createState() => _CreateRepairOrderScreenState();
}

class _CreateRepairOrderScreenState extends State<CreateRepairOrderScreen> {
  final _formKey = GlobalKey<FormState>();
  final _searchController = TextEditingController();
  final _odoController = TextEditingController();
  final _scratchesController = TextEditingController();

  List<CustomerModel> _customers = [];
  List<CustomerModel> _filteredCustomers = [];
  CustomerModel? _selectedCustomer;
  VehicleModel? _selectedCar;

  String _fuelLevel = '50%';
  bool _isLoading = false;
  bool _isFetchingCustomers = true;

  @override
  void initState() {
    super.initState();
    _scratchesController.text = widget.prefillDescription ?? '';
    _fetchCustomers();
  }

  Future<void> _fetchCustomers() async {
    setState(() {
      _isFetchingCustomers = true;
    });

    try {
      final res = await ApiService.get('/customers');
      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        final list = data.map((c) => CustomerModel.fromJson(c)).toList();
        setState(() {
          _customers = list;
          _filteredCustomers = list;

          // Tự động tìm và chọn khách hàng nếu có truyền SĐT từ Lịch hẹn
          if (widget.prefillPhone != null && widget.prefillPhone!.isNotEmpty) {
            final match = _customers.firstWhere(
              (c) => c.phoneNumber == widget.prefillPhone,
              orElse: () => _customers.first, // fallback if not found
            );
            if (match.phoneNumber == widget.prefillPhone) {
              _selectedCustomer = match;
              if (match.vehicles.isNotEmpty) {
                _selectedCar = match.vehicles.first;
              }
              _searchController.text = match.fullName;
            }
          }
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi tải danh sách khách hàng: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() {
        _isFetchingCustomers = false;
      });
    }
  }

  void _filterCustomers(String query) {
    setState(() {
      _filteredCustomers = _customers.where((c) {
        return c.fullName.toLowerCase().contains(query.toLowerCase()) ||
            c.phoneNumber.contains(query);
      }).toList();
    });
  }

  Future<void> _submit() async {
    if (_selectedCustomer == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn khách hàng'), backgroundColor: Colors.orange),
      );
      return;
    }
    if (_selectedCar == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Khách hàng này chưa có xe đăng ký hoặc chưa chọn xe'), backgroundColor: Colors.orange),
      );
      return;
    }
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final payload = {
        'customerId': _selectedCustomer!.id,
        'carId': _selectedCar!.id,
        'checkInInfo': {
          'odo': int.tryParse(_odoController.text.trim()) ?? 0,
          'fuelLevel': _fuelLevel,
          'scratches': _scratchesController.text.trim(),
        }
      };

      final res = await ApiService.post('/repair/orders', payload);
      if (res.statusCode == 200 || res.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tạo phiếu tiếp nhận sửa chữa thành công!'), backgroundColor: Colors.green),
        );
        Navigator.pop(context, true); // Trả về true để màn hình trước tải lại
      } else {
        throw Exception(res.body);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi khi tạo phiếu: $e'), backgroundColor: Colors.red),
      );
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
        title: const Text('Tạo Phiếu Tiếp Nhận', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.blueAccent,
        foregroundColor: Colors.white,
      ),
      body: _isFetchingCustomers
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Step 1: Select Customer
                    _buildSectionHeader('1. Chọn Khách Hàng'),
                    const SizedBox(height: 8),
                    Card(
                      elevation: 0,
                      color: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            TextField(
                              controller: _searchController,
                              decoration: InputDecoration(
                                hintText: 'Tìm theo tên hoặc SĐT...',
                                prefixIcon: const Icon(Icons.search),
                                suffixIcon: _selectedCustomer != null
                                    ? IconButton(
                                        icon: const Icon(Icons.clear),
                                        onPressed: () {
                                          setState(() {
                                            _selectedCustomer = null;
                                            _selectedCar = null;
                                            _searchController.clear();
                                            _filterCustomers('');
                                          });
                                        },
                                      )
                                    : null,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                              ),
                              onChanged: (val) {
                                _filterCustomers(val);
                              },
                            ),
                            if (_selectedCustomer == null && _searchController.text.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Container(
                                constraints: const BoxConstraints(maxHeight: 180),
                                decoration: BoxDecoration(
                                  border: Border.all(color: const Color(0xFFCBD5E1)),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: ListView.builder(
                                  shrinkWrap: true,
                                  itemCount: _filteredCustomers.length,
                                  itemBuilder: (context, index) {
                                    final cust = _filteredCustomers[index];
                                    return ListTile(
                                      title: Text(cust.fullName),
                                      subtitle: Text('SĐT: ${cust.phoneNumber}'),
                                      onTap: () {
                                        setState(() {
                                          _selectedCustomer = cust;
                                          _searchController.text = cust.fullName;
                                          _selectedCar = cust.vehicles.isNotEmpty ? cust.vehicles.first : null;
                                        });
                                      },
                                    );
                                  },
                                ),
                              ),
                            ],
                            if (_selectedCustomer != null) ...[
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.blue.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Khách hàng: ${_selectedCustomer!.fullName}',
                                      style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue.shade900),
                                    ),
                                    const SizedBox(height: 4),
                                    Text('Số điện thoại: ${_selectedCustomer!.phoneNumber}'),
                                    Text('Địa chỉ: ${_selectedCustomer!.address}'),
                                  ],
                                ),
                              ),
                            ]
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Step 2: Select Car
                    _buildSectionHeader('2. Chọn Xe Tiếp Nhận'),
                    const SizedBox(height: 8),
                    Card(
                      elevation: 0,
                      color: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: _selectedCustomer == null
                            ? const Text('Vui lòng chọn khách hàng trước để xem danh sách xe.', style: TextStyle(color: Colors.grey))
                            : _selectedCustomer!.vehicles.isEmpty
                                ? const Text('Khách hàng này chưa đăng ký xe nào trên hệ thống.', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.w600))
                                : DropdownButtonFormField<VehicleModel>(
                                    value: _selectedCar,
                                    isExpanded: true,
                                    items: _selectedCustomer!.vehicles.map((car) {
                                      return DropdownMenuItem<VehicleModel>(
                                        value: car,
                                        child: Text('${car.licensePlate} - ${car.model} (${car.brand})'),
                                      );
                                    }).toList(),
                                    onChanged: (val) {
                                      setState(() {
                                        _selectedCar = val;
                                      });
                                    },
                                    decoration: InputDecoration(
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                    ),
                                  ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Step 3: Check-in Details
                    _buildSectionHeader('3. Thông Tin Tiếp Nhận'),
                    const SizedBox(height: 8),
                    Card(
                      elevation: 0,
                      color: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // ODO
                            TextFormField(
                              controller: _odoController,
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(
                                labelText: 'Số ODO hiện tại (km)',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                prefixIcon: const Icon(Icons.speed),
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) return 'Vui lòng nhập số km';
                                if (int.tryParse(value) == null) return 'Vui lòng nhập định dạng số';
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),

                            // Fuel level
                            DropdownButtonFormField<String>(
                              value: _fuelLevel,
                              decoration: InputDecoration(
                                labelText: 'Mức nhiên liệu hiện tại',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                prefixIcon: const Icon(Icons.local_gas_station_outlined),
                              ),
                              items: const [
                                DropdownMenuItem(value: '10%', child: Text('Hết xăng / 10%')),
                                DropdownMenuItem(value: '25%', child: Text('Thấp / 25%')),
                                DropdownMenuItem(value: '50%', child: Text('Nửa bình / 50%')),
                                DropdownMenuItem(value: '75%', child: Text('Cao / 75%')),
                                DropdownMenuItem(value: '100%', child: Text('Đầy bình / 100%')),
                              ],
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() {
                                    _fuelLevel = val;
                                  });
                                }
                              },
                            ),
                            const SizedBox(height: 16),

                            // Description/Scratches
                            TextFormField(
                              controller: _scratchesController,
                              maxLines: 3,
                              decoration: InputDecoration(
                                labelText: 'Mô tả tình trạng xe & vết xước',
                                alignLabelWithHint: true,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                prefixIcon: const Padding(
                                  padding: EdgeInsets.only(bottom: 40.0),
                                  child: Icon(Icons.description_outlined),
                                ),
                              ),
                              validator: (value) =>
                                  value == null || value.isEmpty ? 'Vui lòng mô tả hư hỏng' : null,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Submit button
                    _isLoading
                        ? const Center(child: CircularProgressIndicator())
                        : ElevatedButton(
                            onPressed: _submit,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blueAccent,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              elevation: 2,
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.save),
                                SizedBox(width: 8),
                                Text(
                                  'Lưu Phiếu Tiếp Nhận',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.bold,
        color: Color(0xFF334155),
      ),
    );
  }
}
