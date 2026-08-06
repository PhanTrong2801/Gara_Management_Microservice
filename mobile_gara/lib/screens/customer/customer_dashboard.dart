import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../api/api_service.dart';
import '../../providers/auth_provider.dart';
import '../../models/customer.dart';
import 'profile_update_screen.dart';
import 'repair_tracking_screen.dart';
import 'booking_appointment_screen.dart';
import 'customer_billing_screen.dart';
import 'customer_profile_screen.dart';
import '../landing_screen.dart';

class CustomerDashboard extends StatefulWidget {
  const CustomerDashboard({super.key});

  @override
  State<CustomerDashboard> createState() => _CustomerDashboardState();
}

class _CustomerDashboardState extends State<CustomerDashboard> {
  CustomerModel? _profile;
  bool _isLoading = true;
  bool _needUpdateProfile = false;

  int _activeRepairs = 0;
  int _upcomingAppointments = 0;
  int _unpaidInvoices = 0;

  @override
  void initState() {
    super.initState();
    _fetchProfileAndData();
  }

  Future<void> _fetchProfileAndData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // 1. Lấy thông tin hồ sơ của khách hàng hiện tại qua GET /customers/me
      final response = await ApiService.get('/customers/me');
      print('[DEBUG] customers/me response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final profileData = jsonDecode(response.body);
        final customer = CustomerModel.fromJson(profileData);

        setState(() {
          _profile = customer;
          // Kiểm tra xem khách hàng có cần cập nhật hồ sơ bắt buộc không
          if (customer.phoneNumber.startsWith('N/A') || customer.phoneNumber.isEmpty || customer.vehicles.isEmpty) {
            _needUpdateProfile = true;
          } else {
            _needUpdateProfile = false;
          }
        });

        if (!_needUpdateProfile) {
          // 2. Lấy dữ liệu thống kê cho Dashboard
          await _fetchDashboardStats(customer.id);
        }
      } else {
        throw Exception('Không thể lấy thông tin hồ sơ khách hàng.');
      }
    } catch (e) {
      print('[DEBUG] Error fetching customer profile: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải thông tin: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _fetchDashboardStats(int customerId) async {
    try {
      List _extract(dynamic d) {
        if (d is List) return d;
        if (d is Map && d.containsKey('content')) return d['content'] as List;
        return [];
      }

      // Lấy danh sách sửa chữa
      final ordersRes = await ApiService.get('/repair/orders/customer/$customerId');
      int activeRepairsCount = 0;
      if (ordersRes.statusCode == 200) {
        final decoded = jsonDecode(utf8.decode(ordersRes.bodyBytes));
        final List orders = _extract(decoded);
        activeRepairsCount = orders.where((o) => o['status'] != 'COMPLETED' && o['status'] != 'CANCELLED').length;
      }

      // Lấy danh sách lịch hẹn
      final apptsRes = await ApiService.get('/repair/appointments/customer/$customerId');
      int upcomingApptsCount = 0;
      if (apptsRes.statusCode == 200) {
        final decoded = jsonDecode(utf8.decode(apptsRes.bodyBytes));
        final List appts = _extract(decoded);
        upcomingApptsCount = appts.where((a) => a['status'] == 'PENDING' || a['status'] == 'CONFIRMED').length;
      }

      // Lấy danh sách hóa đơn chưa thanh toán
      final invoicesRes = await ApiService.get('/billing/invoices/customer/$customerId');
      int unpaidInvoicesCount = 0;
      if (invoicesRes.statusCode == 200) {
        final decoded = jsonDecode(utf8.decode(invoicesRes.bodyBytes));
        final List invoices = _extract(decoded);
        unpaidInvoicesCount = invoices.where((i) => i['status'] != 'PAID').length;
      }

      if (mounted) {
        setState(() {
          _activeRepairs = activeRepairsCount;
          _upcomingAppointments = upcomingApptsCount;
          _unpaidInvoices = unpaidInvoicesCount;
        });
      }
    } catch (e) {
      print('[DEBUG] Error fetching dashboard stats: $e');
    }
  }

  String _getTierLabel(String? tier) {
    switch (tier) {
      case 'PLATINUM': return 'Bạch Kim';
      case 'GOLD': return 'Vàng';
      case 'SILVER': return 'Bạc';
      default: return 'Đồng';
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.currentUser;

    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: Colors.blue),
        ),
      );
    }

    // Nếu khách hàng chưa cập nhật số điện thoại hoặc xe
    if (_needUpdateProfile && _profile != null && user != null) {
      return ProfileUpdateScreen(
        user: user,
        customerProfile: _profile!,
        onUpdateComplete: () {
          _fetchProfileAndData();
        },
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'AutoFlow Customer',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.account_circle_outlined),
            onPressed: () {
              if (_profile != null) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => CustomerProfileScreen(profile: _profile!),
                  ),
                ).then((_) => _fetchProfileAndData()); // Refresh khi quay lại
              }
            },
            tooltip: 'Thông tin cá nhân',
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await authProvider.logout();
              if (context.mounted) {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const LandingScreen()),
                  (route) => false,
                );
              }
            },
            tooltip: 'Đăng xuất',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchProfileAndData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Welcome Banner
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.blue.shade800, Colors.blue.shade500],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.blue.shade200.withValues(alpha: 0.5),
                      blurRadius: 12,
                      offset: const Offset(0, 6),
                    )
                  ],
                ),
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.person, color: Colors.white, size: 24),
                        ),
                        const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Xin chào, ${_profile?.fullName ?? 'Khách hàng'}!',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Chào mừng bạn trở lại AutoFlow. Hệ thống đã sẵn sàng phục vụ các yêu cầu của bạn.',
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFFE0F2FE),
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              const Text(
                'Bảng điều khiển',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 16),

              // Card 1: Xe đang sửa chữa
              _buildMenuCard(
                title: 'Xe đang sửa chữa',
                count: _activeRepairs,
                statusText: 'Hoạt động',
                statusColor: Colors.blue,
                icon: Icons.build_circle_outlined,
                iconColor: Colors.blue.shade600,
                iconBgColor: Colors.blue.shade50,
                onTap: () {
                  if (_profile != null) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => RepairTrackingScreen(customerId: _profile!.id),
                      ),
                    );
                  }
                },
              ),
              const SizedBox(height: 16),

              // Card 2: Đặt lịch hẹn
              _buildMenuCard(
                title: 'Lịch hẹn sửa chữa',
                count: _upcomingAppointments,
                statusText: 'Sắp tới',
                statusColor: Colors.green,
                icon: Icons.calendar_month_outlined,
                iconColor: Colors.green.shade600,
                iconBgColor: Colors.green.shade50,
                onTap: () {
                  if (_profile != null) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => BookingAppointmentScreen(customerId: _profile!.id),
                      ),
                    );
                  }
                },
              ),
              const SizedBox(height: 16),

              // Card 3: Hóa đơn & Thanh toán
              _buildMenuCard(
                title: 'Hóa đơn cần xử lý',
                count: _unpaidInvoices,
                statusText: 'Chưa thanh toán',
                statusColor: Colors.orange,
                icon: Icons.receipt_long_outlined,
                iconColor: Colors.orange.shade600,
                iconBgColor: Colors.orange.shade50,
                onTap: () {
                  if (_profile != null) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => CustomerBillingScreen(customerId: _profile!.id),
                      ),
                    );
                  }
                },
              ),
              const SizedBox(height: 16),

              // Card 4: Thông tin cá nhân & Điểm tích lũy
              _buildMenuCard(
                title: 'Thông tin & Điểm tích lũy',
                count: _profile?.loyalty?.totalPoints ?? 0,
                statusText: 'Hạng ${_getTierLabel(_profile?.loyalty?.tier)}',
                statusColor: Colors.purple,
                icon: Icons.person_outline,
                iconColor: Colors.purple.shade600,
                iconBgColor: Colors.purple.shade50,
                onTap: () {
                  if (_profile != null) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => CustomerProfileScreen(profile: _profile!),
                      ),
                    ).then((_) => _fetchProfileAndData());
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuCard({
    required String title,
    required int count,
    required String statusText,
    required Color statusColor,
    required IconData icon,
    required Color iconColor,
    required Color iconBgColor,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Row(
            children: [
              // Left Icon block
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: iconBgColor,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: iconColor, size: 28),
              ),
              const SizedBox(width: 16),

              // Middle details block
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            statusText,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: statusColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF334155),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$count',
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                  ],
                ),
              ),

              // Right Arrow Icon
              Icon(Icons.arrow_forward_ios, color: Colors.grey.shade400, size: 16),
            ],
          ),
        ),
      ),
    );
  }
}
