import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // LƯU Ý:
  // - Dùng 'http://10.0.2.2:8080/api' nếu chạy trên máy ảo Android (Emulator) kết nối về localhost của máy tính.
  // - Dùng IP Lan của máy bạn (ví dụ: 'http://192.168.1.5:8080/api') nếu chạy trên thiết bị thật.
  static const String baseUrl = "http://10.0.2.2:8080/api";
  // static const String baseUrl = "http://api.gara-autoflow.online:8080/api";

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Future<Map<String, String>> getHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // POST Request
  static Future<http.Response> post(
    String endpoint,
    Map<String, dynamic> body,
  ) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await getHeaders();
    return await http.post(url, headers: headers, body: jsonEncode(body));
  }

  // GET Request
  static Future<http.Response> get(String endpoint) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await getHeaders();
    return await http.get(url, headers: headers);
  }

  // DELETE Request
  static Future<http.Response> delete(String endpoint) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await getHeaders();
    return await http.delete(url, headers: headers);
  }

  // PUT Request
  static Future<http.Response> put(
    String endpoint,
    Map<String, dynamic> body,
  ) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await getHeaders();
    return await http.put(url, headers: headers, body: jsonEncode(body));
  }
}
