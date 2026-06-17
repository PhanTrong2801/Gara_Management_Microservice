import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../api/api_service.dart';
import '../../models/schedule.dart';
import '../../models/shift.dart';
import '../../providers/auth_provider.dart';
import '../login_screen.dart';

class ManagerDashboard extends StatefulWidget {
  const ManagerDashboard({super.key});

  @override
  State<ManagerDashboard> createState() => _ManagerDashboardState();
}

class _ManagerDashboardState extends State<ManagerDashboard> {
  List<ShiftModel> _shifts = [];
  List<ScheduleModel> _schedules = [];
  bool _isLoading = false;
  final String _todayStr = DateTime.now().toIso8601String().split('T')[0];

  @override
  void initState() {
    super.initState();
    _fetchTodayData();
  }

  Future<void> _fetchTodayData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Fetch shifts
      final shiftsRes = await ApiService.get('/auth/schedules/shifts');
      // Fetch schedules for today
      final schedulesRes = await ApiService.get('/auth/schedules?startDate=$_todayStr&endDate=$_todayStr');

      if (shiftsRes.statusCode == 200 && schedulesRes.statusCode == 200) {
        final List shiftsData = jsonDecode(shiftsRes.body);
        final List schedulesData = jsonDecode(schedulesRes.body);

        setState(() {
          _shifts = shiftsData.map((s) => ShiftModel.fromJson(s)).toList();
          _schedules = schedulesData.map((s) => ScheduleModel.fromJson(s)).toList();
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

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.currentUser;

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: const Text('Trưởng Ca - Quản lý Gara'),
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
        onRefresh: _fetchTodayData,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Welcome Header Card
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
                        backgroundColor: Colors.blueAccent.withOpacity(0.1),
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
              const SizedBox(height: 20),

              // Title Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Độ phủ Ca làm ngày $_todayStr',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF334155),
                    ),
                  ),
                  _isLoading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : IconButton(
                          icon: const Icon(Icons.refresh, size: 20),
                          onPressed: _fetchTodayData,
                        ),
                ],
              ),
              const SizedBox(height: 10),

              // Shift Coverage List
              Expanded(
                child: _shifts.isEmpty
                    ? const Center(child: Text('Chưa cấu hình ca mẫu.'))
                    : ListView.builder(
                        itemCount: _shifts.length,
                        itemBuilder: (context, index) {
                          final shift = _shifts[index];
                          // Calculate coverage
                          final shiftSchedules = _schedules.where((s) => s.shiftId == shift.id).toList();
                          final mechanics = shiftSchedules.where((s) => s.roleName == 'MECHANIC' || s.roleName == 'ROLE_MECHANIC').toList();
                          final receptionists = shiftSchedules.where((s) => s.roleName == 'RECEPTIONIST').toList();

                          final isOk = mechanics.length >= 2 && receptionists.length >= 1;

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
                                  // Shift Header
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

                                  // Indicators
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

                                  // Staff details
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'Lễ tân: ${receptionists.length}/1',
                                        style: TextStyle(
                                          color: receptionists.length >= 1 ? Colors.green.shade800 : Colors.red,
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

                                  if (shiftSchedules.isNotEmpty) ...[
                                    const Divider(height: 24, thickness: 1),
                                    const Text(
                                      'Nhân sự trực:',
                                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
                                    ),
                                    const SizedBox(height: 6),
                                    Wrap(
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
                                        );
                                      }).toList(),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
