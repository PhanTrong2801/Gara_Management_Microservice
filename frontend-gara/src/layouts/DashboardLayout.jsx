import {Link, Outlet} from 'react-router-dom';
import { ClipboardList, Wrench, CreditCard, Users, Settings, HelpCircle, PlusCircle } from 'lucide-react';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-gray-50 text-slate-800">
      {/* Sidebar bên trái */}
      <aside className="flex flex-col justify-between w-64 bg-white border-r">
        <div>
          <div className="p-6 text-xl font-bold text-blue-900 border-b">AutoFlow Pro</div>
          <nav className="p-4 space-y-2">
            <a href="/dashboard" className="flex items-center p-3 text-blue-800 bg-blue-50 rounded-lg font-medium">
              <ClipboardList className="w-5 h-5 mr-3"/> Tiếp nhận xe
            </a>

            <a href="/dashboard/customers" className="flex items-center p-3 text-blue-800 bg-blue-50 rounded-lg font-medium">
              <ClipboardList className="w-5 h-5 mr-3"/> Khách hàng & Xe
            </a>

            <Link to="/dashboard/inventory" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg">
              <ClipboardList className="w-5 h-5" />
              Kho vật tư
            </Link>

            <a href="#" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Wrench className="w-5 h-5 mr-3"/> Sửa chữa
            </a>
            <a href="#" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <CreditCard className="w-5 h-5 mr-3"/> Thanh toán
            </a>
            <a href="#" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Users className="w-5 h-5 mr-3"/> Quản trị
            </a>
          </nav>
        </div>
        <div className="p-4 border-t">
          <Link to="/dashboard/create-order" className="flex items-center justify-center w-full p-3 mb-4 text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition">
            <PlusCircle className="w-5 h-5 mr-2"/> Tạo phiếu mới
          </Link>
          <div className="space-y-3 text-sm text-gray-500">
            <a href="#" className="flex items-center hover:text-gray-900"><Settings className="w-4 h-4 mr-3"/> Cài đặt</a>
            <a href="#" className="flex items-center hover:text-gray-900"><HelpCircle className="w-4 h-4 mr-3"/> Hỗ trợ</a>
          </div>
        </div>
      </aside>

      {/* Khu vực nội dung chính bên phải */}
      <main className="flex flex-col flex-1 overflow-hidden">
        {/* Thanh Header trên cùng */}
        <header className="flex items-center justify-between p-6 bg-white border-b">
          <h1 className="text-2xl font-bold">Khu vực tiếp nhận (Reception)</h1>
          <div className="flex items-center space-x-4">
            <input 
              type="text" 
              placeholder="Tìm kiếm biển số, SĐT khách..." 
              className="px-4 py-2 border rounded-full w-80 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100" 
            />
            <div className="w-10 h-10 bg-gray-200 rounded-full cursor-pointer"></div> {/* Avatar Placeholder */}
          </div>
        </header>
        
        {/* Đây là nơi React Router sẽ nhúng các trang con vào (Outlet) */}
        <div className="flex-1 p-6 overflow-y-auto">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
}