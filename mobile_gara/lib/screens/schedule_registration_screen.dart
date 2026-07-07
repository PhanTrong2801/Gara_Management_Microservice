import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../models/schedule_model.dart';
import '../../services/schedule_service.dart';

class ScheduleRegistrationScreen extends StatefulWidget {
  const ScheduleRegistrationScreen({super.key});

  @override
  State<ScheduleRegistrationScreen> createState() => _ScheduleRegistrationScreenState();
}

class _ScheduleRegistrationScreenState extends State<ScheduleRegistrationScreen> {
  DateTime _selectedDate = DateTime.now();
  List<Shift> _shifts = [];
  List<EmployeeSchedule> _allSchedules = [];
  List<DailyShiftConfig> _dailyConfigs = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final shifts = await ScheduleService.getAllShifts();
      
      // Fetch schedules for the current month
      final startOfMonth = DateTime(_selectedDate.year, _selectedDate.month, 1);
      final endOfMonth = DateTime(_selectedDate.year, _selectedDate.month + 1, 0);
      final schedules = await ScheduleService.getAllSchedules(startOfMonth, endOfMonth);
      final configs = await ScheduleService.getDailyConfigs(startOfMonth, endOfMonth);
      
      setState(() {
        _shifts = shifts;
        _allSchedules = schedules;
        _dailyConfigs = configs;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  Future<void> _registerShift(int shiftId) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userId = authProvider.currentUser?.id;
    
    if (userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Lỗi: Không tìm thấy User ID')));
      return;
    }

    try {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator()),
      );
      
      await ScheduleService.registerSchedule(userId, shiftId, _selectedDate);
      
      if (mounted) Navigator.pop(context); // close dialog
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đăng ký ca làm thành công! Đang chờ duyệt.'), backgroundColor: Colors.green),
      );
      
      _fetchData(); // Refresh list
    } catch (e) {
      if (mounted) Navigator.pop(context); // close dialog
      if (mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.warning_amber_rounded, color: Colors.orange),
                SizedBox(width: 8),
                Text('Thông báo'),
              ],
            ),
            content: Text(e.toString().replaceAll('Exception: ', '')),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Đóng'),
              )
            ],
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Đăng ký lịch làm việc'),
        backgroundColor: Colors.blue,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                _buildDateSelector(),
                const Divider(),
                Expanded(
                  child: _buildShiftsList(),
                ),
              ],
            ),
    );
  }

  Widget _buildDateSelector() {
    return Container(
      height: 100,
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: 14, // Next 14 days
        itemBuilder: (context, index) {
          final date = DateTime.now().add(Duration(days: index));
          final isSelected = date.day == _selectedDate.day && 
                             date.month == _selectedDate.month && 
                             date.year == _selectedDate.year;
          
          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedDate = date;
              });
            },
            child: Container(
              width: 70,
              margin: const EdgeInsets.symmetric(horizontal: 5),
              decoration: BoxDecoration(
                color: isSelected ? Colors.blue : Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    DateFormat('E', 'vi').format(date),
                    style: TextStyle(
                      color: isSelected ? Colors.white : Colors.grey,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    DateFormat('dd/MM').format(date),
                    style: TextStyle(
                      color: isSelected ? Colors.white : Colors.black,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildShiftsList() {
    final selectedDateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    
    // Auth provider to check if this user owns the schedule
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final currentUserId = authProvider.currentUser?.id;

    if (_shifts.isEmpty) {
      return const Center(child: Text('Không có ca làm nào được cấu hình.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _shifts.length,
      itemBuilder: (context, index) {
        final shift = _shifts[index];
        
        // Cấu hình ghi đè (nếu có)
        final overrideConfig = _dailyConfigs.where((c) => c.shiftId == shift.id && c.workDate == selectedDateStr).firstOrNull;
        final maxMechanics = overrideConfig != null ? overrideConfig.maxMechanics : shift.maxMechanics;
        final maxCashiers = overrideConfig != null ? overrideConfig.maxCashiers : shift.maxCashiers;

        // Số lượng hiện tại
        final shiftSchedules = _allSchedules.where((s) => s.shiftId == shift.id && s.workDate == selectedDateStr && s.status != 'REJECTED');
        final currentMechanics = shiftSchedules.where((s) => s.roleName == 'MECHANIC' || s.roleName == 'ROLE_MECHANIC').length;
        final currentCashiers = shiftSchedules.where((s) => s.roleName == 'RECEPTIONIST' || s.roleName == 'CASHIER').length;

        // Find if user is registered for this shift on selected date
        final schedule = _allSchedules.where((s) => 
          s.shiftId == shift.id && 
          s.workDate == selectedDateStr &&
          s.userId == currentUserId
        ).firstOrNull;

        return Card(
          elevation: 2,
          margin: const EdgeInsets.only(bottom: 16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        shift.shiftName,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.access_time, size: 16, color: Colors.grey),
                          const SizedBox(width: 4),
                          Text('${shift.startTime.substring(0,5)} - ${shift.endTime.substring(0,5)}', style: const TextStyle(color: Colors.grey)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.blue.shade100)
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '👨‍🔧 Thợ: $currentMechanics/$maxMechanics',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: currentMechanics >= maxMechanics ? Colors.red : Colors.blue.shade700,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '💁‍♀️ Lễ tân: $currentCashiers/$maxCashiers',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: currentCashiers >= maxCashiers ? Colors.red : Colors.blue.shade700,
                              ),
                            ),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
                _buildStatusButton(shift.id, schedule),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusButton(int shiftId, EmployeeSchedule? schedule) {
    if (schedule == null) {
      return ElevatedButton(
        onPressed: () => _registerShift(shiftId),
        style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
        child: const Text('Đăng ký', style: TextStyle(color: Colors.white)),
      );
    }

    Color bgColor;
    String text;
    IconData icon;

    switch (schedule.status) {
      case 'PENDING_APPROVAL':
        bgColor = Colors.orange;
        text = 'Chờ duyệt';
        icon = Icons.hourglass_empty;
        break;
      case 'SCHEDULED':
      case 'ASSIGNED_BY_MANAGER':
        bgColor = Colors.green;
        text = 'Đã xếp lịch';
        icon = Icons.check_circle;
        break;
      case 'REJECTED':
        bgColor = Colors.red;
        text = 'Từ chối';
        icon = Icons.cancel;
        break;
      default:
        bgColor = Colors.grey;
        text = schedule.status;
        icon = Icons.info;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: bgColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: bgColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: bgColor),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(color: bgColor, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}
