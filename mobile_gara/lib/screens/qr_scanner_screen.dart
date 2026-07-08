import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/schedule_service.dart';

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  bool _isProcessing = false;
  MobileScannerController cameraController = MobileScannerController();

  @override
  void dispose() {
    cameraController.dispose();
    super.dispose();
  }

  void _handleBarcode(BarcodeCapture capture) async {
    if (_isProcessing) return; // Prevent multiple scans
    
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty && barcodes.first.rawValue != null) {
      final String code = barcodes.first.rawValue!;
      _processQR(code);
    }
  }

  Future<void> _processQR(String qrToken) async {
    setState(() => _isProcessing = true);
    
    // Tạm dừng camera
    cameraController.stop();
    
    // Show Loading Dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userId = authProvider.currentUser?.id;

    if (userId == null) {
      _showResultDialog(false, "Không tìm thấy thông tin đăng nhập.");
      return;
    }

    try {
      final result = await ScheduleService.scanAttendanceQr(userId, qrToken);
      
      if (!mounted) return;
      Navigator.pop(context); // Close loading dialog
      
      bool isSuccess = true;
      String message = result['message'] ?? 'Điểm danh thành công!';
      
      if (result['status'] == 'CHECK_IN_LATE') {
        isSuccess = false; // Mặc dù thành công nhưng hiển thị cảnh báo đỏ vì đi trễ
      }

      _showResultDialog(isSuccess, message);
      
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // Close loading dialog
      _showResultDialog(false, e.toString().replaceAll('Exception: ', ''));
    }
  }

  void _showResultDialog(bool isSuccess, String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(
              isSuccess ? Icons.check_circle : Icons.warning_amber_rounded,
              color: isSuccess ? Colors.green : Colors.red,
              size: 30,
            ),
            const SizedBox(width: 10),
            Text(isSuccess ? 'Thành công' : 'Chú ý'),
          ],
        ),
        content: Text(
          message,
          style: TextStyle(
            fontSize: 16,
            fontWeight: isSuccess ? FontWeight.normal : FontWeight.bold,
            color: isSuccess ? Colors.black87 : Colors.red.shade700,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx); // Close result dialog
              Navigator.pop(context); // Go back to dashboard
            },
            child: const Text('Đóng'),
          ),
        ],
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      ),
    );
  }

  // --- Dành cho Test trên Emulator ---
  void _showManualInputDialog() {
    final TextEditingController controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Nhập Token (Debug)'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            hintText: 'Dán mã QR Token copy từ Web vào đây...',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                Navigator.pop(ctx);
                _processQR(controller.text.trim());
              }
            },
            child: const Text('Gửi Test'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Quét QR Chấm Công'),
        backgroundColor: Colors.blue,
        actions: [
          IconButton(
            icon: const Icon(Icons.keyboard),
            tooltip: 'Nhập thủ công (Debug)',
            onPressed: _showManualInputDialog,
          )
        ],
      ),
      body: Stack(
        alignment: Alignment.center,
        children: [
          MobileScanner(
            controller: cameraController,
            onDetect: _handleBarcode,
          ),
          // Khung ngắm
          Container(
            width: 250,
            height: 250,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.blue, width: 3),
              borderRadius: BorderRadius.circular(20),
            ),
          ),
          Positioned(
            bottom: 50,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'Hướng camera vào mã QR trên màn hình',
                style: TextStyle(color: Colors.white, fontSize: 16),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
