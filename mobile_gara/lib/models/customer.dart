class VehicleModel {
  final int id;
  final String licensePlate;
  final String brand;
  final String model;
  final int? year;

  VehicleModel({
    required this.id,
    required this.licensePlate,
    required this.brand,
    required this.model,
    this.year,
  });

  factory VehicleModel.fromJson(Map<String, dynamic> json) {
    return VehicleModel(
      id: json['id'] ?? 0,
      licensePlate: json['licensePlate'] ?? '',
      brand: json['brand'] ?? '',
      model: json['model'] ?? '',
      year: json['year'],
    );
  }
}

class CustomerModel {
  final int id;
  final String fullName;
  final String phoneNumber;
  final String email;
  final String address;
  final List<VehicleModel> vehicles;

  CustomerModel({
    required this.id,
    required this.fullName,
    required this.phoneNumber,
    required this.email,
    required this.address,
    required this.vehicles,
  });

  factory CustomerModel.fromJson(Map<String, dynamic> json) {
    var vehiclesList = json['vehicles'] as List? ?? [];
    return CustomerModel(
      id: json['id'] ?? 0,
      fullName: json['fullName'] ?? '',
      phoneNumber: json['phoneNumber'] ?? '',
      email: json['email'] ?? '',
      address: json['address'] ?? '',
      vehicles: vehiclesList.map((v) => VehicleModel.fromJson(v)).toList(),
    );
  }
}
