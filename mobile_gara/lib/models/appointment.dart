class AppointmentModel {
  final String id;
  final int customerId;
  final String appointmentDate;
  final String description;
  final String status; // PENDING, CONFIRMED, CANCELLED
  final String createdAt;

  AppointmentModel({
    required this.id,
    required this.customerId,
    required this.appointmentDate,
    required this.description,
    required this.status,
    required this.createdAt,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    return AppointmentModel(
      id: json['id']?.toString() ?? '',
      customerId: json['customerId'] is int
          ? json['customerId'] as int
          : (int.tryParse(json['customerId']?.toString() ?? '') ?? 0),
      appointmentDate: json['appointmentDate'] ?? '',
      description: json['description'] ?? '',
      status: json['status'] ?? 'PENDING',
      createdAt: json['createdAt'] ?? '',
    );
  }
}
