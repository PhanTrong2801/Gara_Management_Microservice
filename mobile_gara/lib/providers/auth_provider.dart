import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../api/api_service.dart';
import '../models/user.dart';
import '../main.dart'; // To access navigatorKey

class AuthProvider extends ChangeNotifier {
  bool _isLoading = false;
  String? _errorMessage;
  UserModel? _currentUser;
  String? _token;

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  UserModel? get currentUser => _currentUser;
  String? get token => _token;

  // Đăng nhập
  Future<bool> login(String username, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.post('/auth/login', {
        'username': username,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _token = data['token'];
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', _token!);
        await prefs.setString('username', data['username']);

        // Tải thông tin chi tiết user
        await fetchProfile(data['username']);
        
        // Setup FCM for push notifications
        await setupFirebaseMessaging();
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = "Đăng nhập thất bại. Kiểm tra lại tài khoản/mật khẩu!";
      }
    } catch (e) {
      _errorMessage = "Không thể kết nối đến máy chủ: $e";
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  // Đăng nhập bằng Số điện thoại (dành cho Khách Hàng)
  Future<bool> loginWithPhone(String idToken) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.post('/auth/login-phone', {
        'idToken': idToken,
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _token = data['token'];
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', _token!);
        await prefs.setString('username', data['username']);

        // Tải thông tin chi tiết user
        await fetchProfile(data['username']);
        
        // Setup FCM for push notifications
        await setupFirebaseMessaging();
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = "Đăng nhập thất bại. Token không hợp lệ hoặc Server lỗi!";
      }
    } catch (e) {
      _errorMessage = "Không thể kết nối đến máy chủ: $e";
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  // Lấy thông tin cá nhân của user đang đăng nhập
  Future<void> fetchProfile(String username) async {
    try {
      final response = await ApiService.get('/auth/users/me');
      if (response.statusCode == 200) {
        final userJson = jsonDecode(response.body);
        if (userJson != null) {
          _currentUser = UserModel.fromJson(userJson);
          notifyListeners();
        }
      } else {
        print("Lỗi tải profile: ${response.statusCode} - ${response.body}");
      }
    } catch (e) {
      print("Lỗi fetchProfile: $e");
    }
  }

  // Đăng xuất
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('username');
    _token = null;
    _currentUser = null;
    notifyListeners();
  }

  // Tải trạng thái login trước đó
  Future<void> tryAutoLogin() async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.containsKey('token') && prefs.containsKey('username')) {
      _token = prefs.getString('token');
      final username = prefs.getString('username');
        if (username != null) {
        await fetchProfile(username);
        await setupFirebaseMessaging();
      }
    }
  }

  Future<void> setupFirebaseMessaging() async {
    try {
      FirebaseMessaging messaging = FirebaseMessaging.instance;
      NotificationSettings settings = await messaging.requestPermission();

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        String? token = await messaging.getToken();
        if (token != null) {
          print("FCM Token: $token");
          // Call API to update FCM token for the currently logged in user
          await ApiService.put('/customers/me/fcm-token?token=$token', {});
        }

        // Bắt thông báo khi app đang mở (Foreground)
        FirebaseMessaging.onMessage.listen((RemoteMessage message) {
          print('Foreground message received: ${message.notification?.title}');
          if (message.notification != null && navigatorKey.currentContext != null) {
            ScaffoldMessenger.of(navigatorKey.currentContext!).showSnackBar(
              SnackBar(
                content: Text('${message.notification!.title}: ${message.notification!.body}'),
                duration: const Duration(seconds: 5),
                behavior: SnackBarBehavior.floating,
                backgroundColor: Colors.blueAccent,
                margin: const EdgeInsets.only(top: 50, left: 20, right: 20),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            );
          }
        });
      }
    } catch (e) {
      print("Lỗi cấu hình Firebase Messaging: $e");
    }
  }
}
