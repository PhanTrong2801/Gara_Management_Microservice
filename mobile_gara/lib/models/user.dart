class UserModel {
  final int id;
  final String username;
  final String fullName;
  final String role;

  UserModel({
    required this.id,
    required this.username,
    required this.fullName,
    required this.role,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? 0,
      username: json['username'] ?? '',
      fullName: json['fullName'] ?? '',
      role: json['role'] ?? '',
    );
  }
}
