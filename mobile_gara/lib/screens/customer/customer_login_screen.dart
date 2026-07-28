import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../api/api_service.dart';
import 'customer_dashboard.dart';

class CustomerLoginScreen extends StatefulWidget {
  @override
  _CustomerLoginScreenState createState() => _CustomerLoginScreenState();
}

class _CustomerLoginScreenState extends State<CustomerLoginScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  
  bool _otpSent = false;
  bool _isLoading = false;
  String _verificationId = "";
  
  // Sử dụng ApiService.baseUrl thay vì hardcode
  final String _apiUrl = "${ApiService.baseUrl}/auth/login-phone"; 

  Future<void> _sendOTP() async {
    setState(() { _isLoading = true; });
    
    String phone = _phoneController.text.trim();
    if (phone.startsWith("0")) {
      phone = "+84" + phone.substring(1);
    } else if (!phone.startsWith("+")) {
      phone = "+" + phone;
    }

    try {
      await FirebaseAuth.instance.verifyPhoneNumber(
        phoneNumber: phone,
        verificationCompleted: (PhoneAuthCredential credential) async {
          // Android only: Tự động bắt OTP SMS và login
          await _signInWithCredential(credential);
        },
        verificationFailed: (FirebaseAuthException e) {
          _showError("Gửi OTP thất bại: ${e.message}");
          setState(() { _isLoading = false; });
        },
        codeSent: (String verificationId, int? resendToken) {
          setState(() {
            _verificationId = verificationId;
            _otpSent = true;
            _isLoading = false;
          });
        },
        codeAutoRetrievalTimeout: (String verificationId) {
          _verificationId = verificationId;
        },
      );
    } catch (e) {
      _showError("Lỗi: $e");
      setState(() { _isLoading = false; });
    }
  }

  Future<void> _verifyOTP() async {
    setState(() { _isLoading = true; });
    try {
      PhoneAuthCredential credential = PhoneAuthProvider.credential(
        verificationId: _verificationId,
        smsCode: _otpController.text.trim(),
      );
      await _signInWithCredential(credential);
    } catch (e) {
      _showError("Mã OTP không đúng hoặc đã hết hạn!");
      setState(() { _isLoading = false; });
    }
  }

  Future<void> _signInWithCredential(PhoneAuthCredential credential) async {
    try {
      final UserCredential userCredential = await FirebaseAuth.instance.signInWithCredential(credential);
      final User? user = userCredential.user;
      
      if (user != null) {
        String idToken = await user.getIdToken() ?? "";
        await _loginWithBackend(idToken);
      }
    } catch (e) {
      _showError("Lỗi xác thực: $e");
      setState(() { _isLoading = false; });
    }
  }

  Future<void> _loginWithBackend(String idToken) async {
    try {
      final response = await http.post(
        Uri.parse(_apiUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"idToken": idToken}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final prefs = await SharedPreferences.getInstance();
        
        await prefs.setString('token', data['token']);
        await prefs.setString('role', data['role']);
        await prefs.setString('username', data['username']);

        // Giải mã JWT để lấy userId (Tương tự logic cũ)
        List<String> parts = data['token'].split('.');
        if (parts.length == 3) {
          String payload = utf8.decode(base64Url.decode(base64Url.normalize(parts[1])));
          Map<String, dynamic> payloadMap = jsonDecode(payload);
          if (payloadMap.containsKey('userId')) {
            await prefs.setInt('userId', payloadMap['userId']);
          }
        }

        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => CustomerDashboard()),
        );
      } else {
        _showError("Lỗi từ hệ thống: ${response.body}");
        setState(() { _isLoading = false; });
      }
    } catch (e) {
      _showError("Không thể kết nối đến máy chủ.");
      setState(() { _isLoading = false; });
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Đăng nhập Khách hàng")),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Icon(Icons.directions_car, size: 80, color: Colors.blue[900]),
            SizedBox(height: 20),
            Text(
              "Gara AutoFlow Pro", 
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.blue[900]),
            ),
            SizedBox(height: 30),
            
            if (!_otpSent) ...[
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: "Số điện thoại",
                  prefixIcon: Icon(Icons.phone),
                  border: OutlineInputBorder(),
                ),
              ),
              SizedBox(height: 20),
              ElevatedButton(
                onPressed: _isLoading ? null : _sendOTP,
                child: _isLoading ? CircularProgressIndicator(color: Colors.white) : Text("Nhận mã OTP"),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue[900],
                  padding: EdgeInsets.symmetric(vertical: 15),
                ),
              ),
            ] else ...[
              TextField(
                controller: _otpController,
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 20, letterSpacing: 5),
                decoration: InputDecoration(
                  labelText: "Mã OTP 6 số",
                  border: OutlineInputBorder(),
                ),
              ),
              SizedBox(height: 20),
              ElevatedButton(
                onPressed: _isLoading ? null : _verifyOTP,
                child: _isLoading ? CircularProgressIndicator(color: Colors.white) : Text("Xác thực & Đăng nhập"),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  padding: EdgeInsets.symmetric(vertical: 15),
                ),
              ),
              TextButton(
                onPressed: () => setState(() { _otpSent = false; }),
                child: Text("Quay lại đổi số điện thoại"),
              )
            ]
          ],
        ),
      ),
    );
  }
}
