import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import CreateRepairOrder from "./pages/repair/CreateRepairOrder.jsx";
import RepairOrderList from './pages/repair/RepairOrderList';
import CustomerManagement from './pages/customer/CustomerManagement';
import InventoryManagement from "./pages/inventory/InventoryManagement.jsx";


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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;