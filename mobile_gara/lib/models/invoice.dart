class InvoiceModel {
  final int id;
  final String invoiceNumber;
  final String repairOrderNumber;
  final int customerId;
  final double totalLaborCost;
  final double totalPartCost;
  final double totalAmount;
  final String status; // UNPAID, PAID, CANCELLED
  final String? paymentMethod;
  final String createdAt;
  final String? paidAt;

  InvoiceModel({
    required this.id,
    required this.invoiceNumber,
    required this.repairOrderNumber,
    required this.customerId,
    required this.totalLaborCost,
    required this.totalPartCost,
    required this.totalAmount,
    required this.status,
    this.paymentMethod,
    required this.createdAt,
    this.paidAt,
  });

  factory InvoiceModel.fromJson(Map<String, dynamic> json) {
    return InvoiceModel(
      id: json['id'] ?? 0,
      invoiceNumber: json['invoiceNumber'] ?? '',
      repairOrderNumber: json['repairOrderNumber'] ?? '',
      customerId: json['customerId'] ?? 0,
      totalLaborCost: (json['totalLaborCost'] ?? 0.0).toDouble(),
      totalPartCost: (json['totalPartCost'] ?? 0.0).toDouble(),
      totalAmount: (json['totalAmount'] ?? 0.0).toDouble(),
      status: json['status'] ?? 'UNPAID',
      paymentMethod: json['paymentMethod'],
      createdAt: json['createdAt'] ?? '',
      paidAt: json['paidAt'],
    );
  }
}
