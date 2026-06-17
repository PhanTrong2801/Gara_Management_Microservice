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
    );
  }
}
