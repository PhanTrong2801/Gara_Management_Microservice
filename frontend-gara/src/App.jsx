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


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Mặc định vào Web là đẩy sang trang Login */}
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<LoginPage />} />

        {/* Nhóm các trang nằm gọn bên trong Dashboard Layout */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<RepairOrderList />} />
          <Route path="create-order" element={<CreateRepairOrder />} />

          <Route path="customers" element={<CustomerManagement />} />

          <Route path="inventory" element={<InventoryManagement />} />

          <Route path="repairs" element={<RepairManagement />} />
          
          <Route path="billing" element={<BillingManagement />} />
          {/* Admin routes - Protected for admin and manager */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MANAGER', 'admin', 'manager']} />}>
            <Route path="admin" element={<AdminDashboard />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;