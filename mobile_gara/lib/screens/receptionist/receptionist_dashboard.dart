import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'dart:convert';
import '../../providers/auth_provider.dart';
import '../../api/api_service.dart';
import '../qr_scanner_screen.dart';
import '../../models/schedule.dart';
import '../login_screen.dart';

class ReceptionistDashboard extends StatefulWidget {
  const ReceptionistDashboard({super.key});

  @override
  State<ReceptionistDashboard> createState() => _ReceptionistDashboardState();
}

class _ReceptionistDashboardState extends State<ReceptionistDashboard> {
  int _currentIndex = 0;
  List<ScheduleModel> _mySchedules = [];
  List<ScheduleModel> _monthlySchedules = [];
  bool _isLoading = false;

  late String _startDateStr;
  late String _endDateStr;

  @override
  void initState() {
    super.initState();
    _initWeek();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchMySchedules();
      _fetchMonthlyStats();
    });
  }

  void _initWeek() {
    final now = DateTime.now();
    final startOfWeek = now.subtract(Duration(days: now.weekday - 1));
    final endOfWeek = startOfWeek.add(const Duration(days: 6));

    _startDateStr = DateFormat('yyyy-MM-dd').format(startOfWeek);
    _endDateStr = DateFormat('yyyy-MM-dd').format(endOfWeek);
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



  void _logout(BuildContext context) {
    Provider.of<AuthProvider>(context, listen: false).logout();
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).currentUser;
    if (user == null) return const Scaffold(body: Center(child: Text('Chưa đăng nhập')));

    final List<Widget> pages = [
      _buildScheduleTab(),
      _buildStatsTab(),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.teal,
        title: Text(
          _currentIndex == 0 ? 'Lịch Trực Của Tôi' : 'Thống Kê Tháng',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: () => _logout(context),
            tooltip: 'Đăng xuất',
          )
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await _fetchMySchedules();
          await _fetchMonthlyStats();
        },
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
                          _currentIndex == 0 ? Icons.event_available : Icons.bar_chart, 
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
                              user.fullName,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1E293B),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _currentIndex == 0 ? 'Lịch trực lễ tân tuần này' : 'Báo cáo chấm công cá nhân',
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
                    : pages[_currentIndex],
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const QRScannerScreen()),
          ).then((_) {
            _fetchMySchedules();
            _fetchMonthlyStats();
          });
        },
        backgroundColor: Colors.teal,
        child: const Icon(Icons.qr_code_scanner, color: Colors.white),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        selectedItemColor: Colors.teal,
        unselectedItemColor: Colors.grey,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_month),
            label: 'Lịch trực',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.bar_chart),
            label: 'Thống kê',
          ),
        ],
      ),
    );
  }

  Widget _buildScheduleTab() {
    final Map<String, List<ScheduleModel>> groupedSchedules = {};
    for (var s in _mySchedules) {
      groupedSchedules.putIfAbsent(s.workDate, () => []).add(s);
    }

    final sortedDates = groupedSchedules.keys.toList()..sort();
    final todayStr = DateFormat('yyyy-MM-dd').format(DateTime.now());

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        const Text(
          'Lịch trực tuần này',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
        ),
        const SizedBox(height: 12),

        if (sortedDates.isEmpty)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(32.0),
              child: Text('Bạn không có lịch trực tuần này.', style: TextStyle(color: Colors.grey)),
            ),
          ),

        ...sortedDates.map((date) {
          final daySchedules = groupedSchedules[date]!;
          final isToday = date == todayStr;
          final dateParsed = DateTime.parse(date);
          final dayName = DateFormat('EEEE').format(dateParsed);

          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: isToday ? Border.all(color: Colors.teal.shade300, width: 2) : Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: isToday ? Colors.teal.shade50 : Colors.grey.shade50,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(10)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        isToday ? 'Hôm nay' : dayName,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: isToday ? Colors.teal.shade700 : Colors.grey.shade700,
                        ),
                      ),
                      Text(
                        DateFormat('dd/MM/yyyy').format(dateParsed),
                        style: TextStyle(
                          color: isToday ? Colors.teal.shade700 : Colors.grey.shade600,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                ...daySchedules.map((sch) {
                  return Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Container(
                          width: 4,
                          height: 40,
                          decoration: BoxDecoration(
                            color: _getStatusColor(sch.status),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                sch.shiftName,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                              if (sch.checkInTime != null)
                                Padding(
                                  padding: const EdgeInsets.only(top: 2),
                                  child: Text(
                                    'Vào: ${DateFormat('HH:mm').format(DateTime.parse(sch.checkInTime!))}' + (sch.checkOutTime != null ? ' - Ra: ${DateFormat('HH:mm').format(DateTime.parse(sch.checkOutTime!))}' : ''),
                                    style: TextStyle(fontSize: 12, color: Colors.teal.shade700, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              if (sch.lateMinutes != null && sch.lateMinutes! > 0)
                                Text('Đi trễ: ${sch.lateMinutes} phút', style: TextStyle(fontSize: 12, color: Colors.red.shade600, fontWeight: FontWeight.bold)),
                              if (sch.autoCheckout)
                                Container(
                                  margin: const EdgeInsets.only(top: 4),
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.orange.shade50,
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(color: Colors.orange.shade300),
                                  ),
                                  child: Text('⚠️ Quên checkout', style: TextStyle(fontSize: 10, color: Colors.orange.shade800, fontWeight: FontWeight.bold)),
                                ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _getStatusColor(sch.status).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            _translateStatus(sch.status),
                            style: TextStyle(
                              color: _getStatusColor(sch.status),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ],
            ),
          );
        }).toList(),
      ],
    );
  }

  Widget _buildStatsTab() {
    int totalCompleted = _monthlySchedules.where((s) => s.status == 'COMPLETED').length;
    int totalLateMins = _monthlySchedules.fold(0, (sum, s) => sum + (s.lateMinutes ?? 0));
    int totalAutoCheckout = _monthlySchedules.where((s) => s.autoCheckout).length;

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        const Text(
          'Thống kê chấm công (Tháng này)',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: _buildStatCard('Số ca hoàn thành', '$totalCompleted ca', Colors.green)),
            const SizedBox(width: 16),
            Expanded(child: _buildStatCard('Số phút đi trễ', '$totalLateMins phút', Colors.red)),
          ],
        ),
        const SizedBox(height: 16),
        if (totalAutoCheckout > 0)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.orange.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.orange.shade200),
            ),
            child: Row(
              children: [
                Icon(Icons.warning_amber_rounded, color: Colors.orange.shade700, size: 32),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Cảnh báo hệ thống', style: TextStyle(color: Colors.orange.shade900, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text('Tháng này bạn đã quên quét mã ra ca $totalAutoCheckout lần.', style: TextStyle(color: Colors.orange.shade800, fontSize: 13)),
                    ],
                  ),
                )
              ],
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
          Text(title, style: TextStyle(color: color.shade700, fontWeight: FontWeight.bold, fontSize: 13), textAlign: TextAlign.center,),
          const SizedBox(height: 8),
          Text(
            value,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: color.shade900),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PENDING_APPROVAL': return Colors.orange;
      case 'ASSIGNED_BY_MANAGER': return Colors.indigo;
      case 'APPROVED': 
      case 'SCHEDULED': return Colors.grey;
      case 'IN_PROGRESS': return Colors.blue;
      case 'LATE': return Colors.red;
      case 'COMPLETED': return Colors.green;
      case 'REJECTED': return Colors.redAccent;
      default: return Colors.grey;
    }
  }

  String _translateStatus(String status) {
    switch (status) {
      case 'PENDING_APPROVAL': return 'CHỜ DUYỆT';
      case 'ASSIGNED_BY_MANAGER': return 'ĐƯỢC GIAO';
      case 'APPROVED': 
      case 'SCHEDULED': return 'SẮP TỚI';
      case 'IN_PROGRESS': return 'ĐANG LÀM';
      case 'LATE': return 'TRỄ';
      case 'COMPLETED': return 'ĐÃ RA CA';
      case 'REJECTED': return 'TỪ CHỐI';
      default: return status;
    }
  }
}
