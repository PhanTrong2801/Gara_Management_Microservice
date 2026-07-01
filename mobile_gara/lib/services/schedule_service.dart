import 'dart:convert';
import '../api/api_service.dart';
import '../models/schedule_model.dart';
import 'package:intl/intl.dart';

class ScheduleService {
  static Future<List<Shift>> getAllShifts() async {
    try {
      final response = await ApiService.get('/auth/schedules/shifts');
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(utf8.decode(response.bodyBytes));
        return data.map((json) => Shift.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load shifts');
      }
    } catch (e) {
      throw Exception('Error: $e');
    }
  }

  static Future<List<EmployeeSchedule>> getMySchedules(DateTime startDate, DateTime endDate) async {
    try {
      final startStr = DateFormat('yyyy-MM-dd').format(startDate);
      final endStr = DateFormat('yyyy-MM-dd').format(endDate);
      
      final response = await ApiService.get('/auth/schedules?startDate=$startStr&endDate=$endStr');
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(utf8.decode(response.bodyBytes));
        return data.map((json) => EmployeeSchedule.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load schedules');
      }
    } catch (e) {
      throw Exception('Error: $e');
    }
  }

  static Future<EmployeeSchedule> registerSchedule(int userId, int shiftId, DateTime workDate) async {
    try {
      final body = {
        'userId': userId, // In a real secure app, this is not needed if the backend takes it from JWT
        'shiftId': shiftId,
        'workDate': DateFormat('yyyy-MM-dd').format(workDate),
      };
      
      final response = await ApiService.post('/auth/schedules/register', body);
      if (response.statusCode == 200) {
        final data = jsonDecode(utf8.decode(response.bodyBytes));
        return EmployeeSchedule.fromJson(data);
      } else {
        throw Exception('Failed to register schedule: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error: $e');
    }
  }
}
