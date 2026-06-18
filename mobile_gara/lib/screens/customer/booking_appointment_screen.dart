import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../api/api_service.dart';
import '../../models/appointment.dart';

class BookingAppointmentScreen extends StatefulWidget {
  final int customerId;

  const BookingAppointmentScreen({super.key, required this.customerId});

  @override
  State<BookingAppointmentScreen> createState() => _BookingAppointmentScreenState();
}

class _BookingAppointmentScreenState extends State<BookingAppointmentScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _formKey = GlobalKey<FormState>();

  DateTime? _selectedDate;
  final _descriptionController = TextEditingController();

  List<AppointmentModel> _appointments = [];
  bool _isLoadingList = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchAppointments();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _fetchAppointments() async {
    setState(() {
      _isLoadingList = true;
    });

    try {
      final response = await ApiService.get('/repair/appointments/customer/${widget.customerId}');
      print('[DEBUG] appointments response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List data = jsonDecode(response.body);
        setState(() {
          _appointments = data.map((a) => AppointmentModel.fromJson(a)).toList();
          // Sắp xếp mới nhất lên đầu
          _appointments.sort((a, b) => b.id.compareTo(a.id));
        });
      }
    } catch (e) {
      print('[DEBUG] Error fetching appointments: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingList = false;
        });
      }
    }
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(), // Không cho chọn ngày quá khứ
      lastDate: DateTime.now().add(const Duration(days: 90)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: Colors.blue.shade700,
              onPrimary: Colors.white,
              onSurface: const Color(0xFF1E293B),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _submitAppointment() async {
    if (_selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng chọn ngày hẹn mong muốn'), backgroundColor: Colors.orange),
      );
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
    });

    try {
      final dateString = DateFormat('yyyy-MM-dd').format(_selectedDate!);
      // Format gửi lên: dateString + "T00:00:00" giống React web
      final body = {
        'customerId': widget.customerId,
        'appointmentDate': '${dateString}T00:00:00',
        'description': _descriptionController.text.trim(),
      };

      final response = await ApiService.post('/repair/appointments', body);
      print('[DEBUG] post appointment response status: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Đặt lịch thành công! Chúng tôi sẽ liên hệ lại sớm.'),
              backgroundColor: Colors.green,
            ),
          );
        }
        setState(() {
          _selectedDate = null;
          _descriptionController.clear();
        });
        // Tải lại danh sách lịch hẹn và chuyển sang Tab lịch sử
        await _fetchAppointments();
        _tabController.animateTo(1);
      } else {
        throw Exception('Không thể đặt lịch: ${response.body}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Có lỗi xảy ra: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Đặt Lịch Sửa Chữa'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.blue.shade200,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          tabs: const [
            Tab(text: 'Đặt lịch mới', icon: Icon(Icons.add_task)),
            Tab(text: 'Lịch sử đặt hẹn', icon: Icon(Icons.history)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Form đặt lịch mới
          SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Đăng ký lịch sửa chữa',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Vui lòng chọn ngày hẹn mong muốn và điền chi tiết tình trạng hư hỏng của xe để đội ngũ nhân viên chuẩn bị tốt nhất.',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade600,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Date Picker Trigger Card
                  Card(
                    elevation: 0,
                    color: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    child: InkWell(
                      onTap: () => _selectDate(context),
                      borderRadius: BorderRadius.circular(12),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                        child: Row(
                          children: [
                            Icon(Icons.calendar_today, color: Colors.blue.shade700, size: 24),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Ngày hẹn mong muốn',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey.shade500,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    _selectedDate == null
                                        ? 'Chọn ngày...'
                                        : DateFormat('dd/MM/yyyy').format(_selectedDate!),
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: _selectedDate == null
                                          ? Colors.grey.shade400
                                          : const Color(0xFF1E293B),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Icon(Icons.arrow_drop_down, color: Colors.grey.shade400),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Description TextArea
                  TextFormField(
                    controller: _descriptionController,
                    maxLines: 4,
                    validator: (val) => val == null || val.isEmpty ? 'Vui lòng nhập mô tả tình trạng xe' : null,
                    decoration: InputDecoration(
                      labelText: 'Mô tả tình trạng xe / Yêu cầu đặc biệt',
                      hintText: 'Ví dụ: Xe bị xước cản trước, cần thay nhớt định kỳ...',
                      alignLabelWithHint: true,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey.shade300),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey.shade200),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.blue.shade500, width: 2),
                      ),
                      filled: true,
                      fillColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Submit button
                  ElevatedButton(
                    onPressed: _isSubmitting ? null : _submitAppointment,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue.shade700,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 2,
                    ),
                    child: _isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text(
                            'Gửi yêu cầu đặt lịch',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                  ),
                ],
              ),
            ),
          ),

          // Tab 2: Lịch sử đặt hẹn
          _isLoadingList
              ? const Center(child: CircularProgressIndicator(color: Colors.blue))
              : RefreshIndicator(
                  onRefresh: _fetchAppointments,
                  child: _appointments.isEmpty
                      ? ListView(
                          children: [
                            SizedBox(height: MediaQuery.of(context).size.height * 0.2),
                            const Icon(Icons.event_busy, size: 64, color: Colors.grey),
                            const SizedBox(height: 12),
                            const Center(
                              child: Text(
                                'Bạn chưa có lịch hẹn nào.',
                                style: TextStyle(color: Colors.grey, fontSize: 16),
                              ),
                            ),
                          ],
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16.0),
                          itemCount: _appointments.length,
                          itemBuilder: (context, index) {
                            final appt = _appointments[index];
                            final statusInfo = _getStatusInfo(appt.status);

                            // Format dates
                            String rawDate = appt.appointmentDate.split('T')[0];
                            String formattedDate = '';
                            try {
                              formattedDate = DateFormat('dd/MM/yyyy').format(DateTime.parse(rawDate));
                            } catch (_) {
                              formattedDate = rawDate;
                            }

                            String formattedCreated = '';
                            try {
                              formattedCreated = DateFormat('dd/MM/yyyy HH:mm').format(DateTime.parse(appt.createdAt));
                            } catch (_) {
                              formattedCreated = appt.createdAt;
                            }

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
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          'Ngày hẹn: $formattedDate',
                                          style: const TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFF1E293B),
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: statusInfo['color'].withOpacity(0.1),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(statusInfo['icon'], color: statusInfo['color'], size: 14),
                                              const SizedBox(width: 4),
                                              Text(
                                                statusInfo['text'],
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.bold,
                                                  color: statusInfo['color'],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF8FAFC),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: const Color(0xFFF1F5F9)),
                                      ),
                                      child: Text(
                                        appt.description,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          color: Color(0xFF475569),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      'Tạo ngày: $formattedCreated',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: Colors.grey.shade400,
                                      ),
                                      textAlign: TextAlign.right,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
        ],
      ),
    );
  }

  Map<String, dynamic> _getStatusInfo(String status) {
    switch (status) {
      case 'PENDING':
        return {
          'text': 'Chờ xác nhận',
          'color': Colors.orange,
          'icon': Icons.watch_later_outlined,
        };
      case 'CONFIRMED':
        return {
          'text': 'Đã xác nhận',
          'color': Colors.green,
          'icon': Icons.check_circle_outline,
        };
      case 'CANCELLED':
        return {
          'text': 'Đã hủy',
          'color': Colors.red,
          'icon': Icons.cancel_outlined,
        };
      default:
        return {
          'text': status,
          'color': Colors.grey,
          'icon': Icons.info_outline,
        };
    }
  }
}
