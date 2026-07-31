import 'package:flutter/material.dart';
import '../../api/api_service.dart';
import '../../models/user.dart';
import '../../models/customer.dart';

class ProfileUpdateScreen extends StatefulWidget {
  final UserModel user;
  final CustomerModel customerProfile;
  final VoidCallback onUpdateComplete;

  const ProfileUpdateScreen({
    super.key,
    required this.user,
    required this.customerProfile,
    required this.onUpdateComplete,
  });

  @override
  State<ProfileUpdateScreen> createState() => _ProfileUpdateScreenState();
}

class _ProfileUpdateScreenState extends State<ProfileUpdateScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Personal Info Controllers
  late TextEditingController _nameController;
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();

  // Vehicle Info Controllers
  final _plateController = TextEditingController();
  final _brandController = TextEditingController();
  final _modelController = TextEditingController();
  final _yearController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.customerProfile.fullName);
    
    // Nếu phone bắt đầu bằng N/A_ thì lấy số điện thoại thật từ UserModel
    String phone = widget.customerProfile.phoneNumber;
    if (phone.startsWith('N/A')) {
      _phoneController.text = widget.user.username;
    } else {
      _phoneController.text = phone;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _plateController.dispose();
    _brandController.dispose();
    _modelController.dispose();
    _yearController.dispose();
    super.dispose();
  }

  Future<void> _submitData() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      // 1. Cập nhật thông tin cá nhân khách hàng qua PUT /api/customers/{id}
      final profileResponse = await ApiService.put(
        '/customers/${widget.customerProfile.id}',
        {
          'fullName': _nameController.text.trim(),
          'phoneNumber': _phoneController.text.trim(),
          'email': _emailController.text.trim(),
          'address': _addressController.text.trim(),
        },
      );

      if (profileResponse.statusCode != 200 && profileResponse.statusCode != 201) {
        throw Exception('Không thể cập nhật thông tin cá nhân: ${profileResponse.body}');
      }

      // 2. Đăng ký chiếc xe đầu tiên qua POST /api/customers/vehicles
      final vehicleResponse = await ApiService.post(
        '/customers/vehicles',
        {
          'licensePlate': _plateController.text.trim().toUpperCase(),
          'brand': _brandController.text.trim(),
          'model': _modelController.text.trim(),
          'year': _yearController.text.isNotEmpty ? int.parse(_yearController.text.trim()) : null,
          'customerId': widget.customerProfile.id,
        },
      );

      if (vehicleResponse.statusCode != 200 && vehicleResponse.statusCode != 201) {
        throw Exception('Không thể thêm thông tin xe: ${vehicleResponse.body}');
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Cập nhật hồ sơ & xe thành công!'),
            backgroundColor: Colors.green,
          ),
        );
        widget.onUpdateComplete();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi cập nhật: $e'),
            backgroundColor: Colors.red,
          ),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Cập Nhật Thông Tin'),
        backgroundColor: Colors.blue.shade700,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Welcome Header Card
              Card(
                elevation: 0,
                color: Colors.blue.shade50,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: Colors.blue.shade100),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Chào mừng bạn đến với GaraOto!',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue.shade900,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Để tiếp tục sử dụng các dịch vụ đặt lịch và theo dõi tiến độ sửa xe, vui lòng cập nhật thông tin liên lạc và đăng ký ít nhất một chiếc xe của bạn.',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.blue.shade800,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Section 1: Thông tin cá nhân
              _buildSectionHeader('1. Thông tin liên hệ', Icons.person_outline),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _nameController,
                labelText: 'Họ và tên *',
                icon: Icons.person,
                validator: (val) => val == null || val.isEmpty ? 'Vui lòng nhập họ tên' : null,
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _phoneController,
                labelText: 'Số điện thoại *',
                icon: Icons.phone,
                keyboardType: TextInputType.phone,
                validator: (val) {
                  if (val == null || val.isEmpty) return 'Vui lòng nhập số điện thoại';
                  if (val.length < 10) return 'Số điện thoại phải từ 10 chữ số';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _emailController,
                labelText: 'Email',
                icon: Icons.email,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _addressController,
                labelText: 'Địa chỉ',
                icon: Icons.location_on,
              ),
              const SizedBox(height: 32),

              // Section 2: Thông tin Xe
              _buildSectionHeader('2. Thông tin Xe của bạn', Icons.directions_car_outlined),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _plateController,
                labelText: 'Biển số xe *',
                icon: Icons.badge,
                hintText: 'Ví dụ: 30A-12345',
                textCapitalization: TextCapitalization.characters,
                validator: (val) => val == null || val.isEmpty ? 'Vui lòng nhập biển số xe' : null,
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _brandController,
                labelText: 'Hãng xe *',
                icon: Icons.branding_watermark,
                hintText: 'Ví dụ: Toyota, VinFast',
                validator: (val) => val == null || val.isEmpty ? 'Vui lòng nhập hãng xe' : null,
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _modelController,
                labelText: 'Dòng xe (Model)',
                icon: Icons.car_repair,
                hintText: 'Ví dụ: Vios, Fadil',
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _yearController,
                labelText: 'Năm sản xuất',
                icon: Icons.calendar_today,
                keyboardType: TextInputType.number,
                hintText: 'Ví dụ: 2022',
              ),
              const SizedBox(height: 32),

              // Submit Button
              ElevatedButton(
                onPressed: _isLoading ? null : _submitData,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue.shade700,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 2,
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Hoàn tất cập nhật',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: Colors.blue.shade700, size: 22),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1E293B),
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String labelText,
    required IconData icon,
    String? hintText,
    TextInputType keyboardType = TextInputType.text,
    TextCapitalization textCapitalization = TextCapitalization.none,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      textCapitalization: textCapitalization,
      validator: validator,
      decoration: InputDecoration(
        labelText: labelText,
        hintText: hintText,
        prefixIcon: Icon(icon, color: Colors.grey.shade400, size: 20),
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
        contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
      ),
    );
  }
}
