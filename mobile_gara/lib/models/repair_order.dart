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

class RepairPartModel {
  final int partId;
  final String partName;
  final int quantity;
  final double unitPrice;

  RepairPartModel({
    required this.partId,
    required this.partName,
    required this.quantity,
    required this.unitPrice,
  });

  factory RepairPartModel.fromJson(Map<String, dynamic> json) {
    return RepairPartModel(
      partId: json['partId'] ?? 0,
      partName: json['partName'] ?? '',
      quantity: json['quantity'] ?? 0,
      unitPrice: (json['unitPrice'] ?? 0.0).toDouble(),
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
  final String createdAt;
  final bool customerApproved;
  final String? customerSignatureBase64;
  final List<RepairTaskModel> tasks;
  final List<RepairPartModel> parts;

  RepairOrderModel({
    required this.id,
    required this.orderNumber,
    required this.carId,
    required this.customerId,
    required this.status,
    this.advisorId,
    this.mechanicId,
    required this.createdBy,
    required this.createdAt,
    required this.customerApproved,
    this.customerSignatureBase64,
    required this.tasks,
    required this.parts,
  });

  factory RepairOrderModel.fromJson(Map<String, dynamic> json) {
    var tasksList = json['tasks'] as List? ?? [];
    var partsList = json['parts'] as List? ?? [];
    return RepairOrderModel(
      id: json['id'] ?? '',
      orderNumber: json['orderNumber'] ?? '',
      carId: json['carId'] ?? 0,
      customerId: json['customerId'] ?? 0,
      status: json['status'] ?? '',
      advisorId: json['advisorId'],
      mechanicId: json['mechanicId'],
      createdBy: json['createdBy'] ?? '',
      createdAt: json['createdAt'] ?? '',
      customerApproved: json['customerApproved'] ?? false,
      customerSignatureBase64: json['customerSignatureBase64'],
      tasks: tasksList.map((t) => RepairTaskModel.fromJson(t)).toList(),
      parts: partsList.map((p) => RepairPartModel.fromJson(p)).toList(),
    );
  }
}
