class Shift {
  final int id;
  final String shiftName;
  final String startTime;
  final String endTime;
  final int maxMechanics;
  final int maxCashiers;

  Shift({
    required this.id,
    required this.shiftName,
    required this.startTime,
    required this.endTime,
    required this.maxMechanics,
    required this.maxCashiers,
  });

  factory Shift.fromJson(Map<String, dynamic> json) {
    return Shift(
      id: json['id'],
      shiftName: json['shiftName'] ?? '',
      startTime: json['startTime'] ?? '',
      endTime: json['endTime'] ?? '',
      maxMechanics: (json['maxMechanics'] == null || json['maxMechanics'] == 0) ? 2 : json['maxMechanics'],
      maxCashiers: (json['maxCashiers'] == null || json['maxCashiers'] == 0) ? 1 : json['maxCashiers'],
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
  final String? roleName;
  final String? note;

  EmployeeSchedule({
    required this.id,
    required this.userId,
    required this.shiftId,
    required this.shiftName,
    required this.workDate,
    required this.status,
    this.roleName,
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
      roleName: json['roleName'],
      note: json['note'],
    );
  }
}

class DailyShiftConfig {
  final int shiftId;
  final String workDate;
  final int maxMechanics;
  final int maxCashiers;

  DailyShiftConfig({
    required this.shiftId,
    required this.workDate,
    required this.maxMechanics,
    required this.maxCashiers,
  });

  factory DailyShiftConfig.fromJson(Map<String, dynamic> json) {
    return DailyShiftConfig(
      shiftId: json['shiftId'],
      workDate: json['workDate'] ?? '',
      maxMechanics: json['maxMechanics'] ?? 2,
      maxCashiers: json['maxCashiers'] ?? 1,
    );
  }
}
