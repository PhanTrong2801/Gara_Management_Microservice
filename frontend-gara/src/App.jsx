import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import CreateRepairOrder from "./pages/repair/CreateRepairOrder.jsx";
import CustomerManagement from './pages/customer/CustomerManagement';
import InventoryManagement from "./pages/inventory/InventoryManagement.jsx";
import ProtectedRoute from "./layouts/ProtectedRoute.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import RepairManagement from "./pages/repair/RepairManagement.jsx";
import BillingManagement from "./pages/billing/BillingManagement.jsx";
import AppointmentManagement from "./pages/repair/AppointmentManagement.jsx";
import ServiceCatalogManagement from "./pages/repair/ServiceCatalogManagement.jsx";
import SupplierManagement from "./pages/inventory/SupplierManagement.jsx";
import MechanicDashboard from "./pages/repair/MechanicDashboard.jsx";
import VNPayReturn from "./pages/billing/VNPayReturn.jsx";
import ShiftManagement from "./pages/hr/ShiftManagement.jsx";
import MySchedule from "./pages/hr/MySchedule.jsx";
import AttendancePortal from "./pages/hr/AttendancePortal.jsx";

// Customer Portal components
import CustomerLayout from './layouts/CustomerLayout.jsx';
import CustomerDashboard from './pages/customer-portal/CustomerDashboard.jsx';
import RepairTracking from './pages/customer-portal/RepairTracking.jsx';
import BookingAppointment from './pages/customer-portal/BookingAppointment.jsx';
import CustomerBilling from './pages/customer-portal/CustomerBilling.jsx';
import CustomerLogin from './pages/customer-portal/CustomerLogin.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page dành cho Khách vãng lai */}
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/customer/login" element={<CustomerLogin />} />
        
        {/* Callback từ VNPay */}
        <Route path="/vnpay-return" element={<VNPayReturn />} />

        {/* Nhóm các trang nằm gọn bên trong Dashboard Layout */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          
          {/* RECEPTIONIST, MANAGER, ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ADMIN', 'ROLE_MANAGER', 'MANAGER', 'ROLE_RECEPTIONIST', 'RECEPTIONIST']} />}>
            <Route path="appointments" element={<AppointmentManagement />} />
            <Route path="customers" element={<CustomerManagement />} />
          </Route>

          {/* MANAGER, ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ADMIN', 'ROLE_MANAGER', 'MANAGER']} />}>
            <Route index element={<RepairManagement />} />
            <Route path="create-order" element={<CreateRepairOrder />} />
            <Route path="inventory" element={<InventoryManagement />} />
            <Route path="suppliers" element={<SupplierManagement />} />
            <Route path="services" element={<ServiceCatalogManagement />} />
            <Route path="admin" element={<AdminDashboard />} />
          </Route>



          {/* CHỈ DÀNH CHO MECHANIC */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_MECHANIC', 'MECHANIC']} />}>
            <Route path="mechanic/tasks" element={<MechanicDashboard />} />
          </Route>

          {/* RECEPTIONIST, ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ADMIN', 'ROLE_RECEPTIONIST', 'RECEPTIONIST']} />}>
            <Route path="billing" element={<BillingManagement />} />
          </Route>

          {/* MANAGER, ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ADMIN', 'ROLE_MANAGER', 'MANAGER']} />}>
            <Route path="hr/shifts" element={<ShiftManagement />} />
            <Route path="hr/attendance-portal" element={<AttendancePortal />} />
          </Route>

          {/* RECEPTIONIST, MECHANIC */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_RECEPTIONIST', 'RECEPTIONIST', 'ROLE_MECHANIC', 'MECHANIC']} />}>
            <Route path="hr/my-schedule" element={<MySchedule />} />
          </Route>

        </Route>

        {/* Khách hàng - Customer Portal */}
        <Route path="/customer" element={
          <ProtectedRoute allowedRoles={['ROLE_CUSTOMER', 'CUSTOMER']}>
            <CustomerLayout />
          </ProtectedRoute>
        }>
          <Route index element={<CustomerDashboard />} />
          <Route path="tracking" element={<RepairTracking />} />
          <Route path="booking" element={<BookingAppointment />} />
          <Route path="billing" element={<CustomerBilling />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;