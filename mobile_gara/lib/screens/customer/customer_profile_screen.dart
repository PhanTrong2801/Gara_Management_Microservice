import 'dart:convert';
import 'package:flutter/material.dart';
import '../../api/api_service.dart';
import '../../models/customer.dart';

class CustomerProfileScreen extends StatefulWidget {
  final CustomerModel profile;

  const CustomerProfileScreen({super.key, required this.profile});

  @override
  State<CustomerProfileScreen> createState() => _CustomerProfileScreenState();
}

class _CustomerProfileScreenState extends State<CustomerProfileScreen> {
  CustomerModel? _profile;
  bool _isLoading = true;
  List<dynamic> _transactions = [];

  @override
  void initState() {
    super.initState();
    _fetchFullProfile();
  }

  Future<void> _fetchFullProfile() async {
    setState(() => _isLoading = true);
    try {
      // Lấy lại thông tin mới nhất từ API
      final res = await ApiService.get('/customers/me');
      if (res.statusCode == 200) {
        setState(() {
          _profile = CustomerModel.fromJson(jsonDecode(res.body));
        });
      }
      // Lấy lịch sử giao dịch điểm
      final txRes = await ApiService.get('/customers/${widget.profile.id}/loyalty/transactions');
      if (txRes.statusCode == 200) {
        setState(() {
          _transactions = jsonDecode(txRes.body);
        });
      }
    } catch (e) {
      print('[DEBUG] Error fetching profile: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // Hàm chuyển đổi Tier sang tiếng Việt và màu sắc
  String _getTierName(String tier) {
    switch (tier) {
      case 'PLATINUM': return 'BẠCH KIM';
      case 'GOLD': return 'VÀNG';
      case 'SILVER': return 'BẠC';
      default: return 'ĐỒNG';
    }
  }

  Color _getTierColor(String tier) {
    switch (tier) {
      case 'PLATINUM': return const Color(0xFF475569);
      case 'GOLD': return const Color(0xFFD97706);
      case 'SILVER': return const Color(0xFF6B7280);
      default: return const Color(0xFFEA580C);
    }
  }

  IconData _getTierIcon(String tier) {
    switch (tier) {
      case 'PLATINUM': return Icons.diamond_outlined;
      case 'GOLD': return Icons.workspace_premium;
      case 'SILVER': return Icons.verified_outlined;
      default: return Icons.stars_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = _profile ?? widget.profile;
    final loyalty = profile.loyalty;
    final tier = loyalty?.tier ?? 'BRONZE';
    final tierColor = _getTierColor(tier);

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.blue))
          : CustomScrollView(
              slivers: [
                // AppBar hiệu ứng co giãn
                SliverAppBar(
                  expandedHeight: 260,
                  pinned: true,
                  backgroundColor: Colors.blue.shade700,
                  foregroundColor: Colors.white,
                  flexibleSpace: FlexibleSpaceBar(
                    background: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.blue.shade900, Colors.blue.shade600],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                      child: SafeArea(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const SizedBox(height: 30),
                            // Avatar
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white.withOpacity(0.5), width: 3),
                              ),
                              child: CircleAvatar(
                                radius: 40,
                                backgroundColor: Colors.white.withOpacity(0.2),
                                child: Text(
                                  profile.fullName.isNotEmpty ? profile.fullName[0].toUpperCase() : '?',
                                  style: const TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: Colors.white),
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              profile.fullName,
                              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                            const SizedBox(height: 6),
                            // Badge hạng thẻ
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                              decoration: BoxDecoration(
                                color: tierColor.withOpacity(0.9),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(_getTierIcon(tier), color: Colors.white, size: 16),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Hạng ${_getTierName(tier)}',
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // === CARD ĐIỂM TÍCH LŨY ===
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [tierColor.withOpacity(0.15), tierColor.withOpacity(0.05)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: tierColor.withOpacity(0.3)),
                          ),
                          child: Column(
                            children: [
                              Icon(Icons.auto_awesome, color: tierColor, size: 32),
                              const SizedBox(height: 8),
                              Text(
                                '${loyalty?.totalPoints ?? 0}',
                                style: TextStyle(fontSize: 48, fontWeight: FontWeight.w900, color: tierColor),
                              ),
                              const Text(
                                'Điểm tích lũy',
                                style: TextStyle(fontSize: 15, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                              ),
                              const SizedBox(height: 16),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  'Tổng chi tiêu: ${_formatCurrency(loyalty?.totalSpent ?? 0)}',
                                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.grey.shade700),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),

                        // === THÔNG TIN CÁ NHÂN ===
                        _buildSectionTitle('Thông tin cá nhân'),
                        const SizedBox(height: 12),
                        _buildInfoCard([
                          _buildInfoRow(Icons.phone_outlined, 'Số điện thoại', profile.phoneNumber),
                          _buildInfoRow(Icons.email_outlined, 'Email', profile.email.isEmpty ? 'Chưa cập nhật' : profile.email),
                          _buildInfoRow(Icons.location_on_outlined, 'Địa chỉ', profile.address.isEmpty ? 'Chưa cập nhật' : profile.address),
                        ]),
                        const SizedBox(height: 20),

                        // === PHƯƠNG TIỆN ===
                        _buildSectionTitle('Phương tiện đã đăng ký (${profile.vehicles.length})'),
                        const SizedBox(height: 12),
                        if (profile.vehicles.isEmpty)
                          _buildEmptyState('Chưa đăng ký phương tiện nào')
                        else
                          ...profile.vehicles.map((v) => _buildVehicleCard(v)),
                        const SizedBox(height: 20),

                        // === LỊCH SỬ GIAO DỊCH ĐIỂM ===
                        _buildSectionTitle('Lịch sử giao dịch điểm'),
                        const SizedBox(height: 12),
                        if (_transactions.isEmpty)
                          _buildEmptyState('Chưa có giao dịch điểm nào')
                        else
                          ..._transactions.map((tx) => _buildTransactionCard(tx)),
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
    );
  }

  Widget _buildInfoCard(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(children: children),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: Colors.blue.shade600, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade500, fontWeight: FontWeight.w500)),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFF334155))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVehicleCard(VehicleModel vehicle) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.indigo.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.directions_car, color: Colors.indigo.shade400, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  vehicle.licensePlate,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                ),
                const SizedBox(height: 4),
                Text(
                  '${vehicle.brand} ${vehicle.model}${vehicle.year != null ? ' (${vehicle.year})' : ''}',
                  style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionCard(dynamic tx) {
    final int points = tx['points'] ?? 0;
    final String type = tx['type'] ?? 'EARNED';
    final String desc = tx['description'] ?? '';
    final bool isEarned = type == 'EARNED';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isEarned ? Colors.green.shade50 : Colors.red.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isEarned ? Icons.add_circle_outline : Icons.remove_circle_outline,
              color: isEarned ? Colors.green.shade600 : Colors.red.shade600,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  desc.isNotEmpty ? desc : (isEarned ? 'Tích điểm' : 'Đổi điểm'),
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Text(
            '${isEarned ? '+' : '-'}$points',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: isEarned ? Colors.green.shade600 : Colors.red.shade600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Icon(Icons.inbox_outlined, color: Colors.grey.shade300, size: 40),
          const SizedBox(height: 8),
          Text(message, style: TextStyle(color: Colors.grey.shade500, fontSize: 14)),
        ],
      ),
    );
  }

  String _formatCurrency(double amount) {
    if (amount >= 1000000) {
      return '${(amount / 1000000).toStringAsFixed(1)}tr VNĐ';
    } else if (amount >= 1000) {
      return '${(amount / 1000).toStringAsFixed(0)}k VNĐ';
    }
    return '${amount.toInt()} VNĐ';
  }
}
