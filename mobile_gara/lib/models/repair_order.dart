class RepairTaskModel {
  final String serviceCatalogId;
  final String name;
  final double cost;
  final int? mechanicId;
  final String status; // PENDING, DONE
  final String mechanicNote;

  RepairTaskModel({
    required this.serviceCatalogId,
    required this.name,
    required this.cost,
    this.mechanicId,
    required this.status,
    required this.mechanicNote,
  });

  factory RepairTaskModel.fromJson(Map<String, dynamic> json) {
    return RepairTaskModel(
      serviceCatalogId: json['serviceCatalogId'] ?? '',
      name: json['name'] ?? '',
      cost: (json['cost'] ?? 0.0).toDouble(),
      mechanicId: json['mechanicId'],
      status: json['status'] ?? 'PENDING',
      mechanicNote: json['mechanicNote'] ?? '',
    );
  }
}

class RepairOrderModel {
  final String id;
  final String orderNumber;
  final int carId;
  final int customerId;
  final String status; // PENDING, DIAGNOSING, QUOTING, REPAIRING, COMPLETED
  final int? advisorId;
  final int? mechanicId;
  final String createdBy;
  final List<RepairTaskModel> tasks;

  RepairOrderModel({
    required this.id,
    required this.orderNumber,
    required this.carId,
    required this.customerId,
    required this.status,
    this.advisorId,
    this.mechanicId,
    required this.createdBy,
    required this.tasks,
  });

  factory RepairOrderModel.fromJson(Map<String, dynamic> json) {
    var tasksList = json['tasks'] as List? ?? [];
    return RepairOrderModel(
      id: json['id'] ?? '',
      orderNumber: json['orderNumber'] ?? '',
      carId: json['carId'] ?? 0,
      customerId: json['customerId'] ?? 0,
      status: json['status'] ?? '',
      advisorId: json['advisorId'],
      mechanicId: json['mechanicId'],
      createdBy: json['createdBy'] ?? '',
      tasks: tasksList.map((t) => RepairTaskModel.fromJson(t)).toList(),
    );
  }
}
