import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import CreateRepairOrder from "./pages/repair/CreateRepairOrder.jsx";
import RepairOrderList from './pages/repair/RepairOrderList';
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

// Customer Portal components
import CustomerLayout from './layouts/CustomerLayout.jsx';
import CustomerDashboard from './pages/customer-portal/CustomerDashboard.jsx';
import RepairTracking from './pages/customer-portal/RepairTracking.jsx';
import BookingAppointment from './pages/customer-portal/BookingAppointment.jsx';
import CustomerBilling from './pages/customer-portal/CustomerBilling.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Mặc định vào Web là đẩy sang trang Login */}
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<LoginPage />} />

        {/* Nhóm các trang nằm gọn bên trong Dashboard Layout */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          
          {/* RECEPTIONIST, MANAGER, ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ADMIN', 'ROLE_MANAGER', 'MANAGER', 'ROLE_RECEPTIONIST', 'RECEPTIONIST']} />}>
            <Route path="appointments" element={<AppointmentManagement />} />
            <Route path="customers" element={<CustomerManagement />} />
          </Route>

          {/* MANAGER, ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ADMIN', 'ROLE_MANAGER', 'MANAGER']} />}>
            <Route index element={<RepairOrderList />} />
            <Route path="create-order" element={<CreateRepairOrder />} />
            <Route path="inventory" element={<InventoryManagement />} />
            <Route path="suppliers" element={<SupplierManagement />} />
            <Route path="services" element={<ServiceCatalogManagement />} />
            <Route path="admin" element={<AdminDashboard />} />
          </Route>

          {/* MANAGER, ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ADMIN', 'ROLE_MANAGER', 'MANAGER']} />}>
            <Route path="repairs" element={<RepairManagement />} />
          </Route>

          {/* CHỈ DÀNH CHO MECHANIC */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_MECHANIC', 'MECHANIC']} />}>
            <Route path="mechanic/tasks" element={<MechanicDashboard />} />
          </Route>

          {/* RECEPTIONIST, ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ADMIN', 'ROLE_RECEPTIONIST', 'RECEPTIONIST']} />}>
            <Route path="billing" element={<BillingManagement />} />
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