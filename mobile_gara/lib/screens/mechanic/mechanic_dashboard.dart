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
import '../schedule_registration_screen.dart';
import '../qr_scanner_screen.dart';

class MechanicDashboard extends StatefulWidget {
  const MechanicDashboard({super.key});

  @override
  State<MechanicDashboard> createState() => _MechanicDashboardState();
}

class _MechanicDashboardState extends State<MechanicDashboard> {
  int _currentIndex = 0; // 0: Lịch Trực, 1: Nhiệm Vụ Sửa Chữa, 2: Thống kê
  List<ScheduleModel> _mySchedules = [];
  List<RepairOrderModel> _myOrders = [];
  List<ScheduleModel> _monthlySchedules = [];
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
    } else if (_currentIndex == 1) {
      await _fetchMyOrders();
    } else {
      await _fetchMonthlyStats();
    }
  }

  Future<void> _fetchMonthlyStats() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.currentUser;
    if (user == null) return;

    setState(() => _isLoading = true);

    try {
      final now = DateTime.now();
      final firstDay = DateTime(now.year, now.month, 1).toIso8601String().split('T')[0];
      final lastDay = DateTime(now.year, now.month + 1, 0).toIso8601String().split('T')[0];
      
      final response = await ApiService.get('/auth/schedules?startDate=$firstDay&endDate=$lastDay');
      if (response.statusCode == 200) {
        final decoded = jsonDecode(utf8.decode(response.bodyBytes));
        List data;
        if (decoded is List) {
          data = decoded;
        } else if (decoded is Map && decoded.containsKey('content')) {
          data = decoded['content'] as List;
        } else {
          data = [];
        }
        final allSchedules = data.map((s) => ScheduleModel.fromJson(s)).toList();

        setState(() {
          _monthlySchedules = allSchedules.where((s) => s.userId == user.id).toList();
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Lỗi tải thống kê: $e')));
    } finally {
      setState(() => _isLoading = false);
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
        final decoded = jsonDecode(response.body);
        List data;
        if (decoded is List) {
          data = decoded;
        } else if (decoded is Map && decoded.containsKey('content')) {
          data = decoded['content'] as List;
        } else {
          data = [];
        }
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
      final response = await ApiService.get('/repair/orders/mechanic/${user.id}');
      print('[DEBUG] repair/orders/mechanic status: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        List data;
        if (decoded is List) {
          data = decoded;
        } else if (decoded is Map && decoded.containsKey('content')) {
          data = decoded['content'] as List;
        } else {
          data = [];
        }

        final allOrders = data.map((o) => RepairOrderModel.fromJson(o)).toList();

        setState(() {
          // Chỉ lấy những phiếu được gán cho thợ này (API đã lọc sẵn)
          _myOrders = allOrders;
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
                        : _currentIndex == 1 
                            ? _buildTasksTab()
                            : _buildStatsTab(),
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
          BottomNavigationBarItem(
            icon: Icon(Icons.pie_chart),
            label: 'Thống kê',
          ),
        ],
      ),
      floatingActionButton: _currentIndex == 0 ? FloatingActionButton.extended(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const QRScannerScreen()),
          ).then((_) => _fetchData()); // Refresh sau khi chấm công
        },
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.qr_code_scanner, size: 28),
        label: const Text('CHẤM CÔNG', style: TextStyle(fontWeight: FontWeight.w900)),
      ) : null,
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
        ElevatedButton.icon(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ScheduleRegistrationScreen()),
            );
          },
          icon: const Icon(Icons.add_task),
          label: const Text('Đăng ký lịch làm việc mới'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.teal.shade50,
            foregroundColor: Colors.teal,
            elevation: 0,
            side: BorderSide(color: Colors.teal.shade200),
          ),
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
                                        Row(
                                          children: [
                                            Text(
                                              sch.shiftName,
                                              style: TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 14,
                                                color: sch.status == 'REJECTED' ? Colors.grey : const Color(0xFF1E293B),
                                                decoration: sch.status == 'REJECTED' ? TextDecoration.lineThrough : null,
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            if (sch.status == 'PENDING_APPROVAL')
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: Colors.orange.shade50,
                                                  borderRadius: BorderRadius.circular(4),
                                                  border: Border.all(color: Colors.orange.shade200),
                                                ),
                                                child: Text('Chờ duyệt', style: TextStyle(fontSize: 9, color: Colors.orange.shade800)),
                                              ),
                                            if (sch.status == 'REJECTED')
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: Colors.red.shade50,
                                                  borderRadius: BorderRadius.circular(4),
                                                  border: Border.all(color: Colors.red.shade200),
                                                ),
                                                child: Text('Từ chối', style: TextStyle(fontSize: 9, color: Colors.red.shade800)),
                                              ),
                                            if (sch.status == 'SCHEDULED')
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: Colors.green.shade50,
                                                  borderRadius: BorderRadius.circular(4),
                                                  border: Border.all(color: Colors.green.shade200),
                                                ),
                                                child: Text('Đã duyệt', style: TextStyle(fontSize: 9, color: Colors.green.shade800)),
                                              ),
                                            if (sch.status == 'COMPLETED')
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: Colors.blue.shade50,
                                                  borderRadius: BorderRadius.circular(4),
                                                  border: Border.all(color: Colors.blue.shade200),
                                                ),
                                                child: Text('Hoàn thành', style: TextStyle(fontSize: 9, color: Colors.blue.shade800)),
                                              ),
                                            if (sch.status == 'LATE')
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: Colors.red.shade50,
                                                  borderRadius: BorderRadius.circular(4),
                                                  border: Border.all(color: Colors.red.shade200),
                                                ),
                                                child: Text('Đi trễ', style: TextStyle(fontSize: 9, color: Colors.red.shade800)),
                                              ),
                                            if (sch.status == 'IN_PROGRESS')
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: Colors.teal.shade50,
                                                  borderRadius: BorderRadius.circular(4),
                                                  border: Border.all(color: Colors.teal.shade200),
                                                ),
                                                child: Text('Đang làm', style: TextStyle(fontSize: 9, color: Colors.teal.shade800)),
                                              ),
                                          ],
                                        ),
                                        if (sch.checkInTime != null)
                                          Padding(
                                            padding: const EdgeInsets.only(top: 2),
                                            child: Text(
                                              'Vào: ${DateFormat('HH:mm').format(DateTime.parse(sch.checkInTime!))}' + (sch.checkOutTime != null ? ' - Ra: ${DateFormat('HH:mm').format(DateTime.parse(sch.checkOutTime!))}' : ''),
                                              style: TextStyle(fontSize: 10, color: Colors.teal.shade700, fontWeight: FontWeight.bold),
                                            ),
                                          ),
                                        if (sch.lateMinutes != null && sch.lateMinutes! > 0)
                                          Text('Đi trễ: ${sch.lateMinutes} phút', style: TextStyle(fontSize: 10, color: Colors.red.shade600, fontWeight: FontWeight.bold)),
                                        if (sch.autoCheckout)
                                          Container(
                                            margin: const EdgeInsets.only(top: 2),
                                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                            decoration: BoxDecoration(
                                              color: Colors.orange.shade50,
                                              borderRadius: BorderRadius.circular(4),
                                              border: Border.all(color: Colors.orange.shade300),
                                            ),
                                            child: Text('⚠️ Quên checkout', style: TextStyle(fontSize: 9, color: Colors.orange.shade800, fontWeight: FontWeight.bold)),
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
                      if (todaySchedules.any((s) => s.status == 'SCHEDULED'))
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

  Widget _buildStatsTab() {
    int totalSchedules = _monthlySchedules.where((s) => s.status != 'REJECTED' && s.status != 'PENDING_APPROVAL').length;
    int completed = _monthlySchedules.where((s) => s.status == 'COMPLETED').length;
    int lateSchedules = _monthlySchedules.where((s) => s.status == 'LATE').length;
    int totalLateMinutes = _monthlySchedules.fold(0, (sum, s) => sum + (s.lateMinutes ?? 0));
    
    // Nếu status == 'SCHEDULED' mà workDate < today thì coi như Absent
    final todayStr = DateTime.now().toIso8601String().split('T')[0];
    int absent = _monthlySchedules.where((s) => s.status == 'SCHEDULED' && s.workDate.compareTo(todayStr) < 0).length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Thống kê Chấm Công Tháng Này',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildStatCard('Tổng ca', totalSchedules.toString(), Colors.blue),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildStatCard('Hoàn thành', completed.toString(), Colors.green),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildStatCard('Đi trễ', '$lateSchedules ca\n($totalLateMinutes p)', Colors.orange),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildStatCard('Vắng mặt', absent.toString(), Colors.red),
            ),
          ],
        ),
        const SizedBox(height: 20),
        const Text(
          'Lịch sử Gần Đây',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
        ),
        const SizedBox(height: 10),
        Expanded(
          child: ListView.builder(
            itemCount: _monthlySchedules.where((s) => s.checkInTime != null).length,
            itemBuilder: (context, index) {
              final history = _monthlySchedules.where((s) => s.checkInTime != null).toList().reversed.toList();
              final sch = history[index];
              final date = DateFormat('dd/MM/yyyy').format(DateTime.parse(sch.workDate));
              final checkIn = DateFormat('HH:mm').format(DateTime.parse(sch.checkInTime!));
              final checkOut = sch.checkOutTime != null ? DateFormat('HH:mm').format(DateTime.parse(sch.checkOutTime!)) : 'Chưa ra';

              return Card(
                elevation: 0,
                color: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                child: ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: Colors.teal,
                    child: Icon(Icons.check, color: Colors.white),
                  ),
                  title: Text(sch.shiftName, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text('Vào: $checkIn  |  Ra: $checkOut'),
                  trailing: Text(date, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, MaterialColor color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.shade200),
      ),
      child: Column(
        children: [
          Text(title, style: TextStyle(color: color.shade700, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(
            value,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: color.shade900),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PENDING':
      case 'RECEIVED':
        return Colors.orange;
      case 'DIAGNOSING':
        return Colors.blue;
      case 'QUOTING':
        return Colors.purple;
      case 'APPROVED':
        return Colors.teal;
      case 'REPAIRING':
        return Colors.indigo;
      case 'COMPLETED':
        return Colors.green;
      case 'CANCELLED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _translateStatus(String status) {
    switch (status) {
      case 'PENDING':
      case 'RECEIVED':
        return 'Chờ nhận xe';
      case 'DIAGNOSING':
        return 'Đang chẩn đoán';
      case 'QUOTING':
        return 'Đang báo giá';
      case 'APPROVED':
        return 'Đã duyệt giá';
      case 'REPAIRING':
        return 'Đang sửa chữa';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  }
}
