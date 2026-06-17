import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api/api_service.dart';
import '../models/user.dart';

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

  // Lấy thông tin cá nhân bằng cách lọc danh sách users
  Future<void> fetchProfile(String username) async {
    try {
      final response = await ApiService.get('/auth/users');
      if (response.statusCode == 200) {
        final List list = jsonDecode(response.body);
        final userJson = list.firstWhere(
          (u) => u['username'] == username,
          orElse: () => null,
        );
        if (userJson != null) {
          _currentUser = UserModel.fromJson(userJson);
          notifyListeners();
        }
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
      }
    }
  }
}
