class ScheduleModel {
  final int id;
  final int userId;
  final String fullName;
  final String roleName;
  final int shiftId;
  final String shiftName;
  final String workDate;
  final String status;
  final String note;
  final String? checkInTime;
  final String? checkOutTime;
  final int? lateMinutes;
  final bool autoCheckout;

  ScheduleModel({
    required this.id,
    required this.userId,
    required this.fullName,
    required this.roleName,
    required this.shiftId,
    required this.shiftName,
    required this.workDate,
    required this.status,
    required this.note,
    this.checkInTime,
    this.checkOutTime,
    this.lateMinutes,
    this.autoCheckout = false,
  });

  factory ScheduleModel.fromJson(Map<String, dynamic> json) {
    return ScheduleModel(
      id: json['id'] ?? 0,
      userId: json['userId'] ?? 0,
      fullName: json['fullName'] ?? '',
      roleName: json['roleName'] ?? '',
      shiftId: json['shiftId'] ?? 0,
      shiftName: json['shiftName'] ?? '',
      workDate: json['workDate'] ?? '',
      status: json['status'] ?? '',
      note: json['note'] ?? '',
      checkInTime: json['checkInTime'],
      checkOutTime: json['checkOutTime'],
      lateMinutes: json['lateMinutes'],
      autoCheckout: json['autoCheckout'] == true,
    );
  }
}

class DailyShiftConfigModel {
  final int shiftId;
  final String workDate;
  final int maxMechanics;
  final int maxCashiers;

  DailyShiftConfigModel({
    required this.shiftId,
    required this.workDate,
    required this.maxMechanics,
    required this.maxCashiers,
  });

  factory DailyShiftConfigModel.fromJson(Map<String, dynamic> json) {
    return DailyShiftConfigModel(
      shiftId: json['shiftId'],
      workDate: json['workDate'] ?? '',
      maxMechanics: json['maxMechanics'] ?? 2,
      maxCashiers: json['maxCashiers'] ?? 1,
    );
  }
}
