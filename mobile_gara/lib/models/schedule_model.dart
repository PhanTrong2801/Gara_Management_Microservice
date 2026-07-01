class Shift {
  final int id;
  final String shiftName;
  final String startTime;
  final String endTime;

  Shift({
    required this.id,
    required this.shiftName,
    required this.startTime,
    required this.endTime,
  });

  factory Shift.fromJson(Map<String, dynamic> json) {
    return Shift(
      id: json['id'],
      shiftName: json['shiftName'] ?? '',
      startTime: json['startTime'] ?? '',
      endTime: json['endTime'] ?? '',
    );
  }
}

class EmployeeSchedule {
  final int id;
  final int userId;
  final int shiftId;
  final String shiftName;
  final String workDate;
  final String status;
  final String? note;

  EmployeeSchedule({
    required this.id,
    required this.userId,
    required this.shiftId,
    required this.shiftName,
    required this.workDate,
    required this.status,
    this.note,
  });

  factory EmployeeSchedule.fromJson(Map<String, dynamic> json) {
    return EmployeeSchedule(
      id: json['id'],
      userId: json['userId'],
      shiftId: json['shiftId'],
      shiftName: json['shiftName'] ?? '',
      workDate: json['workDate'] ?? '',
      status: json['status'] ?? 'SCHEDULED',
      note: json['note'],
    );
  }
}
