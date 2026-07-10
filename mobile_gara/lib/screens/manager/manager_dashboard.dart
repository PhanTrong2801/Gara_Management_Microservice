import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../api/api_service.dart';
import '../../models/schedule.dart';
import '../../models/shift.dart';
import '../../providers/auth_provider.dart';
import '../login_screen.dart';
import '../../models/user.dart';
import '../../models/appointment.dart';
import '../../models/repair_order.dart';
import '../../models/customer.dart';
import '../mechanic/repair_order_detail.dart';
import 'create_repair_order_screen.dart';

class ManagerDashboard extends StatefulWidget {
  const ManagerDashboard({super.key});

  @override
  State<ManagerDashboard> createState() => _ManagerDashboardState();
}

class _ManagerDashboardState extends State<ManagerDashboard> {
  // Tab 1: Scheduling
  List<ShiftModel> _shifts = [];
  List<ScheduleModel> _schedules = [];

  // Tab 2: Appointments
  List<AppointmentModel> _appointments = [];

  // Tab 3: Repair Orders
  List<RepairOrderModel> _repairOrders = [];

  // Metadata
  List<CustomerModel> _customersList = [];
  Map<int, CustomerModel> _customersMap = {};

  bool _isLoading = false;
  int _currentIndex = 0;
  DateTime _selectedDate = DateTime.now();
  String get _selectedDateStr => _selectedDate.toIso8601String().split('T')[0];

  @override
  void initState() {
    super.initState();
    _fetchAllData();
  }

  Future<void> _fetchAllData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Fetch shifts and schedules (Tab 1)
      final shiftsRes = await ApiService.get('/auth/schedules/shifts');
      final schedulesRes = await ApiService.get('/auth/schedules?startDate=$_selectedDateStr&endDate=$_selectedDateStr');

      // Fetch customers (needed for Tab 2 and Tab 3 mapping)
      final customersRes = await ApiService.get('/customers');

      // Fetch appointments (Tab 2)
      final appointmentsRes = await ApiService.get('/repair/appointments');

      // Fetch repair orders (Tab 3)
      final ordersRes = await ApiService.get('/repair/orders?size=500&sort=createdAt,desc');

      if (shiftsRes.statusCode == 200 &&
          schedulesRes.statusCode == 200 &&
          customersRes.statusCode == 200 &&
          appointmentsRes.statusCode == 200 &&
          ordersRes.statusCode == 200) {
        
        final shiftsDecoded = jsonDecode(utf8.decode(shiftsRes.bodyBytes));
        final schedulesDecoded = jsonDecode(utf8.decode(schedulesRes.bodyBytes));
        final customersDecoded = jsonDecode(utf8.decode(customersRes.bodyBytes));
        final appointmentsDecoded = jsonDecode(utf8.decode(appointmentsRes.bodyBytes));
        final ordersDecoded = jsonDecode(utf8.decode(ordersRes.bodyBytes));

        List _extract(dynamic d) {
          if (d is List) return d;
          if (d is Map && d.containsKey('content')) return d['content'] as List;
          return [];
        }

        final List shiftsData = _extract(shiftsDecoded);
        final List schedulesData = _extract(schedulesDecoded);
        final List customersData = _extract(customersDecoded);
        final List appointmentsData = _extract(appointmentsDecoded);
        final List ordersData = _extract(ordersDecoded);

        final customers = customersData.map((c) => CustomerModel.fromJson(c)).toList();
        final Map<int, CustomerModel> custMap = {for (var c in customers) c.id: c};

        setState(() {
          _shifts = shiftsData.map((s) => ShiftModel.fromJson(s)).toList();
          _schedules = schedulesData.map((s) => ScheduleModel.fromJson(s)).toList();
          _customersList = customers;
          _customersMap = custMap;
          _appointments = appointmentsData.map((a) => AppointmentModel.fromJson(a)).toList();
          // Sort appointments: PENDING first, then by date desc
          _appointments.sort((a, b) {
            if (a.status == 'PENDING' && b.status != 'PENDING') return -1;
            if (a.status != 'PENDING' && b.status == 'PENDING') return 1;
            return b.appointmentDate.compareTo(a.appointmentDate);
          });
          _repairOrders = ordersData.map((o) => RepairOrderModel.fromJson(o)).toList();
          // Sort repair orders by newest first
          _repairOrders.sort((a, b) => b.id.compareTo(a.id));
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi kết nối dữ liệu: $e')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _deleteSchedule(int scheduleId, String employeeName) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận xóa'),
        content: Text('Bạn có chắc chắn muốn xóa phân công cho $employeeName không?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final res = await ApiService.delete('/auth/schedules/$scheduleId');
      if (res.statusCode == 200 || res.statusCode == 204) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Xóa phân công thành công!'), backgroundColor: Colors.green),
        );
        _fetchAllData();
      } else {
        throw Exception('Không thể xóa phân công');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi khi xóa: $e'), backgroundColor: Colors.red),
      );
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _showAssignDialog(ShiftModel shift) async {
    List<UserModel> availableStaff = [];
    bool loadingStaff = true;
    UserModel? selectedUser;
    final noteController = TextEditingController();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            if (loadingStaff) {
              ApiService.get('/auth/users').then((res) {
                if (res.statusCode == 200) {
                  final decoded = jsonDecode(utf8.decode(res.bodyBytes));
                  List data = [];
                  if (decoded is List) data = decoded;
                  else if (decoded is Map && decoded.containsKey('content')) data = decoded['content'] as List;
                  
                  final allUsers = data.map((u) => UserModel.fromJson(u)).toList();
                  final staff = allUsers.where((u) =>
                      u.role == 'MECHANIC' ||
                      u.role == 'ROLE_MECHANIC' ||
                      u.role == 'RECEPTIONIST' ||
                      u.role == 'ROLE_RECEPTIONIST').toList();

                  setDialogState(() {
                    availableStaff = staff;
                    loadingStaff = false;
                  });
                } else {
                  setDialogState(() {
                    loadingStaff = false;
                  });
                }
              }).catchError((e) {
                setDialogState(() {
                  loadingStaff = false;
                });
              });
            }

            return AlertDialog(
              title: Text('Phân công - ${shift.shiftName}'),
              content: loadingStaff
                  ? const SizedBox(
                      height: 100,
                      child: Center(child: CircularProgressIndicator()),
                    )
                  : Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text(
                          'Chọn nhân viên túc trực:',
                          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                        ),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<UserModel>(
                          initialValue: selectedUser,
                          hint: const Text('Chọn nhân viên...'),
                          isExpanded: true,
                          items: availableStaff.map((u) {
                            String roleViet = u.role.contains('MECHANIC') ? 'Thợ máy' : 'Lễ tân';
                            return DropdownMenuItem<UserModel>(
                              value: u,
                              child: Text('${u.fullName} ($roleViet)'),
                            );
                          }).toList(),
                          onChanged: (val) {
                            setDialogState(() {
                              selectedUser = val;
                            });
                          },
                          decoration: InputDecoration(
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Ghi chú:',
                          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: noteController,
                          decoration: InputDecoration(
                            hintText: 'Nhập ghi chú (nếu có)...',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
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
                  onPressed: selectedUser == null
                      ? null
                      : () async {
                          Navigator.pop(context);
                          await _assignSchedule(
                            userId: selectedUser!.id,
                            shiftId: shift.id,
                            note: noteController.text.trim(),
                          );
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blueAccent,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Xác nhận'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _assignSchedule({
    required int userId,
    required int shiftId,
    required String note,
  }) async {
    setState(() {
      _isLoading = true;
    });

    try {
      final body = {
        'userId': userId,
        'shiftId': shiftId,
        'workDate': _selectedDateStr,
        'note': note,
      };

      final res = await ApiService.post('/auth/schedules', body);
      if (res.statusCode == 200 || res.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Phân công nhân sự thành công!'), backgroundColor: Colors.green),
        );
        _fetchAllData();
      } else {
        throw Exception('Không thể phân công ca');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi khi phân công: $e'), backgroundColor: Colors.red),
      );
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _updateAppointmentStatus(String appointmentId, String status) async {
    setState(() {
      _isLoading = true;
    });

    try {
      final res = await ApiService.put('/repair/appointments/$appointmentId/status', {
        'status': status,
      });

      if (res.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Cập nhật lịch hẹn thành công: $status!'), backgroundColor: Colors.green),
        );
        _fetchAllData();
      } else {
        throw Exception(res.body);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi cập nhật lịch hẹn: $e'), backgroundColor: Colors.red),
      );
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.currentUser;

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: const Text('Trưởng Ca - Quản lý Gara', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.blueAccent,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await authProvider.logout();
              if (context.mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchAllData,
        child: _isLoading && _shifts.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Welcome Header Card (Only show on Scheduling tab for compact view)
                    if (_currentIndex == 0) ...[
                      Card(
                        elevation: 0,
                        color: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 28,
                                backgroundColor: Colors.blueAccent.withValues(alpha: 0.1),
                                child: const Icon(Icons.person, color: Colors.blueAccent, size: 28),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Xin chào, ${user?.fullName ?? "Trưởng ca"}',
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF1E293B),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    const Text(
                                      'Tình trạng túc trực của xưởng hôm nay',
                                      style: TextStyle(fontSize: 13, color: Colors.grey),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],

                    Expanded(
                      child: _buildCurrentTab(),
                    ),
                  ],
                ),
              ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        selectedItemColor: Colors.blueAccent,
        unselectedItemColor: Colors.grey,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.schedule),
            label: 'Lịch trực',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_month),
            label: 'Lịch hẹn',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.build_circle_outlined),
            label: 'Phiếu sửa',
          ),
        ],
      ),
      floatingActionButton: _currentIndex == 2
          ? FloatingActionButton(
              onPressed: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const CreateRepairOrderScreen()),
                );
                if (result == true) {
                  _fetchAllData();
                }
              },
              backgroundColor: Colors.blueAccent,
              foregroundColor: Colors.white,
              child: const Icon(Icons.add),
            )
          : null,
    );
  }

  Widget _buildCurrentTab() {
    switch (_currentIndex) {
      case 0:
        return _buildShiftTab();
      case 1:
        return _buildAppointmentTab();
      case 2:
        return _buildRepairOrderTab();
      default:
        return const SizedBox();
    }
  }

  Widget _buildShiftTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Card(
          elevation: 0,
          color: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left, color: Colors.blueAccent),
                  onPressed: () {
                    setState(() {
                      _selectedDate = _selectedDate.subtract(const Duration(days: 1));
                    });
                    _fetchAllData();
                  },
                ),
                TextButton.icon(
                  onPressed: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _selectedDate,
                      firstDate: DateTime.now().subtract(const Duration(days: 365)),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (picked != null) {
                      setState(() {
                        _selectedDate = picked;
                      });
                      _fetchAllData();
                    }
                  },
                  icon: const Icon(Icons.calendar_month, color: Colors.blueAccent, size: 20),
                  label: Text(
                    _selectedDateStr,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right, color: Colors.blueAccent),
                  onPressed: () {
                    setState(() {
                      _selectedDate = _selectedDate.add(const Duration(days: 1));
                    });
                    _fetchAllData();
                  },
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Độ phủ ca làm việc',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF334155),
              ),
            ),
            if (_isLoading)
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
          ],
        ),
        const SizedBox(height: 10),
        Expanded(
          child: _shifts.isEmpty
              ? const Center(child: Text('Chưa cấu hình ca mẫu.'))
              : ListView.builder(
                  itemCount: _shifts.length,
                  itemBuilder: (context, index) {
                    final shift = _shifts[index];
                    final shiftSchedules = _schedules.where((s) => s.shiftId == shift.id).toList();
                    final mechanics = shiftSchedules.where((s) => s.roleName == 'MECHANIC' || s.roleName == 'ROLE_MECHANIC').toList();
                    final receptionists = shiftSchedules.where((s) => s.roleName == 'RECEPTIONIST').toList();

                    final isOk = mechanics.length >= 2 && receptionists.isNotEmpty;

                    return Card(
                      elevation: 0,
                      margin: const EdgeInsets.only(bottom: 12),
                      color: isOk ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(
                          color: isOk ? const Color(0xFFA7F3D0) : const Color(0xFFFECACA),
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
                                Text(
                                  shift.shiftName,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: Color(0xFF1E293B),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFCBD5E1)),
                                  ),
                                  child: Text(
                                    '${shift.startTime.substring(0, 5)} - ${shift.endTime.substring(0, 5)}',
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                  ),
                                )
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Icon(
                                  isOk ? Icons.check_circle_outline : Icons.error_outline_rounded,
                                  color: isOk ? Colors.green : Colors.redAccent,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  isOk ? 'Đủ nhân sự trực' : 'Thiếu nhân sự túc trực',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: isOk ? Colors.green.shade800 : Colors.redAccent.shade700,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Lễ tân: ${receptionists.length}/1',
                                  style: TextStyle(
                                    color: receptionists.isNotEmpty ? Colors.green.shade800 : Colors.red,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  'Thợ máy: ${mechanics.length}/2',
                                  style: TextStyle(
                                    color: mechanics.length >= 2 ? Colors.green.shade800 : Colors.red,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                            const Divider(height: 24, thickness: 1),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Nhân sự trực:',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
                                ),
                                TextButton.icon(
                                  onPressed: () => _showAssignDialog(shift),
                                  icon: const Icon(Icons.add, size: 16),
                                  label: const Text('Phân công', style: TextStyle(fontSize: 12)),
                                  style: TextButton.styleFrom(
                                    padding: EdgeInsets.zero,
                                    minimumSize: const Size(50, 30),
                                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    foregroundColor: Colors.blueAccent,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            shiftSchedules.isEmpty
                                ? const Padding(
                                    padding: EdgeInsets.symmetric(vertical: 4.0),
                                    child: Text(
                                      'Chưa phân công nhân sự.',
                                      style: TextStyle(fontSize: 13, fontStyle: FontStyle.italic, color: Colors.grey),
                                    ),
                                  )
                                : Wrap(
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: shiftSchedules.map((s) {
                                      final isMech = s.roleName == 'MECHANIC' || s.roleName == 'ROLE_MECHANIC';
                                      return Chip(
                                        label: Text(s.fullName),
                                        avatar: Icon(
                                          isMech ? Icons.build_circle_outlined : Icons.support_agent_outlined,
                                          size: 16,
                                        ),
                                        backgroundColor: Colors.white,
                                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                                        onDeleted: () => _deleteSchedule(s.id, s.fullName),
                                        deleteIconColor: Colors.redAccent,
                                      );
                                    }).toList(),
                                  ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildAppointmentTab() {
    if (_appointments.isEmpty) {
      return const Center(child: Text('Không có lịch hẹn nào.'));
    }

    return ListView.builder(
      itemCount: _appointments.length,
      itemBuilder: (context, index) {
        final appt = _appointments[index];
        final customer = _customersMap[appt.customerId];
        final customerName = customer?.fullName ?? "Khách hàng ẩn danh";
        final phone = customer?.phoneNumber ?? "Không có SĐT";

        Color statusColor = Colors.grey;
        String statusText = appt.status;
        if (appt.status == 'PENDING') {
          statusColor = Colors.orange;
          statusText = 'Chờ xác nhận';
        } else if (appt.status == 'CONFIRMED') {
          statusColor = Colors.green;
          statusText = 'Đã xác nhận';
        } else if (appt.status == 'CANCELLED') {
          statusColor = Colors.red;
          statusText = 'Đã hủy';
        } else if (appt.status == 'COMPLETED') {
          statusColor = Colors.blue;
          statusText = 'Hoàn thành';
        }

        return Card(
          elevation: 0,
          margin: const EdgeInsets.only(bottom: 12),
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      customerName,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        statusText,
                        style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text('SĐT: $phone', style: const TextStyle(color: Colors.grey, fontSize: 14)),
                const SizedBox(height: 4),
                Text(
                  'Ngày hẹn: ${appt.appointmentDate.replaceFirst("T", " ").substring(0, 16)}',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 8),
                const Divider(height: 12),
                const SizedBox(height: 4),
                Text(
                  'Lý do/Mô tả: ${appt.description}',
                  style: const TextStyle(fontSize: 14),
                ),
                if (appt.status == 'PENDING' || appt.status == 'CONFIRMED') ...[
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      if (appt.status == 'PENDING') ...[
                        OutlinedButton(
                          onPressed: () => _updateAppointmentStatus(appt.id, 'CANCELLED'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.red,
                            side: const BorderSide(color: Colors.red),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          ),
                          child: const Text('Hủy hẹn'),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: () => _updateAppointmentStatus(appt.id, 'CONFIRMED'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          ),
                          child: const Text('Xác nhận'),
                        ),
                        const SizedBox(width: 8),
                      ],
                      ElevatedButton.icon(
                        onPressed: () async {
                          final result = await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => CreateRepairOrderScreen(
                                prefillPhone: phone,
                                prefillDescription: appt.description,
                              ),
                            ),
                          );
                          if (result == true) {
                            _fetchAllData();
                            setState(() {
                              _currentIndex = 2; // Switch to Repair Orders tab
                            });
                          }
                        },
                        icon: const Icon(Icons.add, size: 16),
                        label: const Text('Tạo phiếu'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blueAccent,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildRepairOrderTab() {
    if (_repairOrders.isEmpty) {
      return const Center(child: Text('Không có phiếu sửa chữa nào.'));
    }

    return ListView.builder(
      itemCount: _repairOrders.length,
      itemBuilder: (context, index) {
        final order = _repairOrders[index];
        final customer = _customersMap[order.customerId];
        final customerName = customer?.fullName ?? "Khách hàng ẩn danh";

        // Find car info
        final car = customer?.vehicles.firstWhere(
          (v) => v.id == order.carId,
          orElse: () => VehicleModel(id: 0, licensePlate: "Chưa rõ", brand: "", model: ""),
        );
        final licensePlate = car?.licensePlate ?? "Chưa rõ";
        final carModel = car != null && car.model.isNotEmpty ? '${car.brand} ${car.model}' : 'Xe tiếp nhận';

        Color statusColor = Colors.grey;
        String statusText = order.status;
        switch (order.status) {
          case 'PENDING':
          case 'RECEIVED':
            statusColor = Colors.orange;
            statusText = 'Đã tiếp nhận';
            break;
          case 'DIAGNOSING':
            statusColor = Colors.blue;
            statusText = 'Đang chẩn đoán';
            break;
          case 'QUOTING':
            statusColor = Colors.purple;
            statusText = 'Đang báo giá';
            break;
          case 'APPROVED':
            statusColor = Colors.teal;
            statusText = 'Đã duyệt giá';
            break;
          case 'REPAIRING':
            statusColor = Colors.indigo;
            statusText = 'Đang sửa chữa';
            break;
          case 'COMPLETED':
            statusColor = Colors.green;
            statusText = 'Đã hoàn thành';
            break;
          case 'CANCELLED':
            statusColor = Colors.red;
            statusText = 'Đã hủy';
            break;
        }

        return Card(
          elevation: 0,
          margin: const EdgeInsets.only(bottom: 12),
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      order.orderNumber,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.blueAccent),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        statusText,
                        style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.person_outline, size: 18, color: Colors.grey),
                    const SizedBox(width: 6),
                    Text('Khách hàng: $customerName', style: const TextStyle(fontSize: 14)),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.directions_car_outlined, size: 18, color: Colors.grey),
                    const SizedBox(width: 6),
                    Text('$carModel - BKS: $licensePlate', style: const TextStyle(fontSize: 14)),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.calendar_month_outlined, size: 18, color: Colors.grey),
                    const SizedBox(width: 6),
                    Text(
                      'Ngày lập: ${order.createdAt.replaceFirst("T", " ").substring(0, 16)}',
                      style: const TextStyle(fontSize: 13, color: Colors.grey),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Divider(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => RepairOrderDetailScreen(
                              order: order,
                              onRefresh: _fetchAllData,
                            ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.info_outline, size: 16),
                      label: const Text('Xem chi tiết'),
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.blueAccent,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
