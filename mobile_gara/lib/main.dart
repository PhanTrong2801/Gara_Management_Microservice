import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'providers/auth_provider.dart';
import 'screens/landing_screen.dart';
import 'screens/manager/manager_dashboard.dart';
import 'screens/mechanic/mechanic_dashboard.dart';
import 'screens/customer/customer_dashboard.dart';
import 'screens/receptionist/receptionist_dashboard.dart';
import 'services/notification_service.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print("Handling a background message: ${message.messageId}");
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  await NotificationService.init();

  
  // Khởi tạo hiển thị ngày tháng chuẩn Tiếng Việt (Thứ Hai, Thứ Ba...)
  await initializeDateFormatting('vi', null);
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GaraOto Management App',
      navigatorKey: navigatorKey,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        primarySwatch: Colors.blue,
        fontFamily: 'Roboto',
      ),
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _checkLogin();
  }

  void _checkLogin() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.tryAutoLogin();

    setState(() {
      _isInitialized = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.currentUser;

    if (user != null) {
      if (user.role == 'MANAGER' || user.role == 'ADMIN') {
        return const ManagerDashboard();
      } else if (user.role == 'MECHANIC' || user.role == 'ROLE_MECHANIC') {
        return const MechanicDashboard();
      } else if (user.role == 'RECEPTIONIST' || user.role == 'ROLE_RECEPTIONIST') {
        return const ReceptionistDashboard();
      } else if (user.role == 'CUSTOMER' || user.role == 'ROLE_CUSTOMER') {
        return const CustomerDashboard();
      }
    }

    return const LandingScreen();
  }
}
