import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../api/api_service.dart';
import '../../models/schedule.dart';
import '../../models/repair_order.dart';
import '../../providers/auth_provider.dart';
import '../login_screen.dart';
import 'repair_order_detail.dart';

class MechanicDashboard extends StatefulWidget {
  const MechanicDashboard({super.key});

  @override
  State<MechanicDashboard> createState() => _MechanicDashboardState();
}

class _MechanicDashboardState extends State<MechanicDashboard> {
  int _currentIndex = 0; // 0: Lịch Trực, 1: Nhiệm Vụ Sửa Chữa
  List<ScheduleModel> _mySchedules = [];
  List<RepairOrderModel> _myOrders = [];
  bool _isLoading = false;

  // Start Date / End Date of the current week (Mon -> Sun)
  late String _startDateStr;
  late String _endDateStr;

  @override
  void initState() {
    super.initState();
    _calculateCurrentWeek();
    _fetchData();
  }

  void _calculateCurrentWeek() {
    final now = DateTime.now();
    final monday = now.subtract(Duration(days: now.weekday - 1));
    final sunday = monday.add(const Duration(days: 6));
    
    _startDateStr = monday.toIso8601String().split('T')[0];
    _endDateStr = sunday.toIso8601String().split('T')[0];
  }

  Future<void> _fetchData() async {
    if (_currentIndex == 0) {
      await _fetchMySchedules();
    } else {
      await _fetchMyOrders();
    }
  }

  Future<void> _fetchMySchedules() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.currentUser;
    if (user == null) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await ApiService.get('/auth/schedules?startDate=$_startDateStr&endDate=$_endDateStr');
      if (response.statusCode == 200) {
        final List data = jsonDecode(response.body);
        final allSchedules = data.map((s) => ScheduleModel.fromJson(s)).toList();

        setState(() {
          _mySchedules = allSchedules.where((s) => s.userId == user.id).toList();
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi tải lịch: $e')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchMyOrders() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.currentUser;
    if (user == null) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await ApiService.get('/repair/orders');
      print('[DEBUG] repair/orders status: ${response.statusCode}');
      print('[DEBUG] repair/orders body: ${response.body.substring(0, response.body.length > 300 ? 300 : response.body.length)}');
      
      if (response.statusCode == 200) {
        final List data = jsonDecode(response.body);
        final allOrders = data.map((o) => RepairOrderModel.fromJson(o)).toList();

        print('[DEBUG] Tổng số phiếu: ${allOrders.length}');
        print('[DEBUG] User ID hiện tại: ${user.id}');

        setState(() {
          // Hiển thị tất cả phiếu đang sửa chữa (giống web MechanicDashboard)
          // Nếu mechanicId được gán thì lọc theo thợ, nếu không thì hiển thị phiếu đang REPAIRING
          _myOrders = allOrders.where((o) {
            // Ưu tiên lọc theo mechanicId nếu được gán
            if (o.mechanicId != null && o.mechanicId == user.id) return true;
            // Nếu chưa gán mechanicId thì hiển thị tất cả phiếu đang REPAIRING
            if (o.mechanicId == null && o.status == 'REPAIRING') return true;
            return false;
          }).toList();

          print('[DEBUG] Số phiếu sau lọc: ${_myOrders.length}');
        });
      } else {
        print('[DEBUG] Lỗi API: ${response.statusCode} - ${response.body}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('API trả về lỗi: ${response.statusCode}')),
        );
      }
    } catch (e) {
      print('[DEBUG] Exception khi gọi repair/orders: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi tải nhiệm vụ: $e')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  // Generate 7 days of the week for display
  List<DateTime> get _daysOfWeek {
    final start = DateTime.parse(_startDateStr);
    return List.generate(7, (index) => start.add(Duration(days: index)));
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.currentUser;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(_currentIndex == 0 ? 'Thợ Máy - Lịch Làm Việc' : 'Nhiệm Vụ Sửa Chữa'),
        backgroundColor: Colors.teal,
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
        onRefresh: _fetchData,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Welcome Header
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
                        backgroundColor: Colors.teal.withValues(alpha: 0.1),
                        child: Icon(
                          _currentIndex == 0 ? Icons.construction : Icons.assignment, 
                          color: Colors.teal, 
                          size: 28
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user?.fullName ?? 'Thợ máy',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1E293B),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _currentIndex == 0 ? 'Lịch trực túc trực tuần này' : 'Các phiếu sửa chữa bạn phụ trách',
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Dynamic Tab Content
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _currentIndex == 0 
                        ? _buildScheduleTab() 
                        : _buildTasksTab(),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        selectedItemColor: Colors.teal,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
          _fetchData();
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_month),
            label: 'Lịch trực',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.build),
            label: 'Nhiệm vụ',
          ),
        ],
      ),
    );
  }

  Widget _buildScheduleTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Lịch trực tuần này',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF334155),
              ),
            ),
            Text(
              '${DateFormat('dd/MM').format(DateTime.parse(_startDateStr))} - ${DateFormat('dd/MM/yyyy').format(DateTime.parse(_endDateStr))}',
              style: const TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Expanded(
          child: ListView.builder(
            itemCount: 7,
            itemBuilder: (context, index) {
              final day = _daysOfWeek[index];
              final dayStr = day.toIso8601String().split('T')[0];
              final dayName = DateFormat('EEEE', 'vi').format(day);
              final shortDate = DateFormat('dd/MM').format(day);

              final todaySchedules = _mySchedules.where((s) => s.workDate == dayStr).toList();

              return Card(
                elevation: 0,
                margin: const EdgeInsets.only(bottom: 10),
                color: todaySchedules.isNotEmpty ? Colors.white : const Color(0xFFF1F5F9).withValues(alpha: 0.5),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(
                    color: todaySchedules.isNotEmpty ? Colors.teal.shade200 : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  child: Row(
                    children: [
                      Container(
                        width: 60,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: todaySchedules.isNotEmpty ? Colors.teal.shade50 : const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          children: [
                            Text(
                              shortDate,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: todaySchedules.isNotEmpty ? Colors.teal.shade900 : Colors.grey.shade700,
                              ),
                            ),
                            Text(
                              dayName.replaceFirst('Thứ ', 'T'),
                              style: TextStyle(
                                fontSize: 10,
                                color: todaySchedules.isNotEmpty ? Colors.teal.shade700 : Colors.grey,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: todaySchedules.isEmpty
                            ? const Text(
                                'Nghỉ phép / Không có ca',
                                style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic, fontSize: 13),
                              )
                            : Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: todaySchedules.map((sch) {
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 4.0),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          sch.shiftName,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                            color: Color(0xFF1E293B),
                                          ),
                                        ),
                                        if (sch.note.isNotEmpty)
                                          Text(
                                            'Ghi chú: ${sch.note}',
                                            style: const TextStyle(fontSize: 11, color: Colors.grey),
                                          ),
                                      ],
                                    ),
                                  );
                                }).toList(),
                              ),
                      ),
                      if (todaySchedules.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.green.shade200),
                          ),
                          child: Text(
                            'Đi làm',
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.green.shade800,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
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

  Widget _buildTasksTab() {
    if (_myOrders.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.check_circle_outline, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'Tuyệt vời! Bạn không có nhiệm vụ sửa chữa nào được giao.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: _myOrders.length,
      itemBuilder: (context, index) {
        final order = _myOrders[index];
        final completedTasks = order.tasks.where((t) => t.status == 'DONE').length;
        final totalTasks = order.tasks.length;
        
        return Card(
          elevation: 0,
          margin: const EdgeInsets.only(bottom: 12),
          color: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => RepairOrderDetailScreen(
                    order: order,
                    onRefresh: _fetchMyOrders,
                  ),
                ),
              );
            },
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
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _getStatusColor(order.status).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          _translateStatus(order.status),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: _getStatusColor(order.status),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  
                  // Progress indicator
                  Row(
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: totalTasks == 0 ? 0 : completedTasks / totalTasks,
                            backgroundColor: const Color(0xFFF1F5F9),
                            valueColor: const AlwaysStoppedAnimation<Color>(Colors.teal),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '$completedTasks/$totalTasks Công việc',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
                      )
                    ],
                  ),
                  const SizedBox(height: 10),
                  
                  // Preview first few tasks
                  if (order.tasks.isNotEmpty) ...[
                    const Divider(height: 16),
                    Text(
                      'Chi tiết công việc:',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey.shade700),
                    ),
                    const SizedBox(height: 6),
                    Column(
                      children: order.tasks.take(2).map((t) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2.0),
                        child: Row(
                          children: [
                            Icon(
                              t.status == 'DONE' ? Icons.check_circle : Icons.radio_button_unchecked,
                              size: 14,
                              color: t.status == 'DONE' ? Colors.green : Colors.grey,
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                t.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 12,
                                  decoration: t.status == 'DONE' ? TextDecoration.lineThrough : null,
                                  color: t.status == 'DONE' ? Colors.grey : const Color(0xFF334155),
                                ),
                              ),
                            )
                          ],
                        ),
                      )).toList(),
                    ),
                    if (order.tasks.length > 2)
                      Padding(
                        padding: const EdgeInsets.only(top: 4.0),
                        child: Text(
                          'và ${order.tasks.length - 2} công việc khác...',
                          style: const TextStyle(fontSize: 10, color: Colors.teal, fontStyle: FontStyle.italic),
                        ),
                      )
                  ]
                ],
              ),
            ),
          ),
        );
      },
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
