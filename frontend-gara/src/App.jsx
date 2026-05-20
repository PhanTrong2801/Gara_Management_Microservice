import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Mặc định vào Web là đẩy sang trang Login */}
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<LoginPage />} />

        {/* Nhóm các trang nằm gọn bên trong Dashboard Layout */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Outlet: Chỗ này sau này chúng ta sẽ code Bảng danh sách xe */}
          <Route index element={
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-500">
              Khu vực hiển thị danh sách xe đang xử lý (Code ở bước tiếp theo)
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;