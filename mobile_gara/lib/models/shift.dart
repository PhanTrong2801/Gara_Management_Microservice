class ShiftModel {
  final int id;
  final String shiftName;
  final String startTime;
  final String endTime;
  final String description;
  final int maxMechanics;
  final int maxCashiers;

  ShiftModel({
    required this.id,
    required this.shiftName,
    required this.startTime,
    required this.endTime,
    required this.description,
    required this.maxMechanics,
    required this.maxCashiers,
  });

  factory ShiftModel.fromJson(Map<String, dynamic> json) {
    return ShiftModel(
      id: json['id'] ?? 0,
      shiftName: json['shiftName'] ?? '',
      startTime: json['startTime'] ?? '',
      endTime: json['endTime'] ?? '',
      description: json['description'] ?? '',
      maxMechanics: json['maxMechanics'] ?? 2,
      maxCashiers: json['maxCashiers'] ?? 1,
    );
  }
}
