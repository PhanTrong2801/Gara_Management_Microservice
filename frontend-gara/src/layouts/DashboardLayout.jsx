import {Link, Outlet, useLocation} from 'react-router-dom';
import { ClipboardList, Wrench, CreditCard, Users, Settings, HelpCircle, PlusCircle, Package, LogOut, Calendar, Clock } from 'lucide-react';

export default function DashboardLayout() {
  const role = localStorage.getItem('role');
  const location = useLocation();

  // Helper to check if a nav item is active
  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const baseStyle = "flex items-center p-3 rounded-lg font-medium transition-colors";
  const activeStyle = "text-blue-800 bg-blue-50";
  const inactiveStyle = "text-gray-600 hover:bg-gray-100";

  const userRole = role ? role.toUpperCase() : '';

  // Menu items config with allowed roles
  const menuConfig = [
    { path: '/dashboard', label: 'Điều phối và sửa chữa', icon: <ClipboardList className="w-5 h-5 mr-3" />, roles: ['ROLE_ADMIN', 'ADMIN', 'ROLE_MANAGER', 'MANAGER'] },
    { path: '/dashboard/appointments', label: 'Lịch hẹn', icon: <Calendar className="w-5 h-5 mr-3" />, roles: ['ROLE_ADMIN', 'ADMIN', 'ROLE_MANAGER', 'MANAGER', 'ROLE_RECEPTIONIST', 'RECEPTIONIST'] },
    { path: '/dashboard/customers', label: 'Khách hàng & Xe', icon: <Users className="w-5 h-5 mr-3" />, roles: ['ROLE_ADMIN', 'ADMIN', 'ROLE_MANAGER', 'MANAGER', 'ROLE_RECEPTIONIST', 'RECEPTIONIST'] },
    { path: '/dashboard/inventory', label: 'Kho vật tư', icon: <Package className="w-5 h-5 mr-3" />, roles: ['ROLE_ADMIN', 'ADMIN', 'ROLE_MANAGER', 'MANAGER'] },
    { path: '/dashboard/services', label: 'Dịch vụ', icon: <Settings className="w-5 h-5 mr-3" />, roles: ['ROLE_ADMIN', 'ADMIN', 'ROLE_MANAGER', 'MANAGER'] },
    { path: '/dashboard/mechanic/tasks', label: 'Trạm Sửa Chữa', icon: <Wrench className="w-5 h-5 mr-3" />, roles: ['ROLE_MECHANIC', 'MECHANIC'] },
    { path: '/dashboard/billing', label: 'Thanh toán', icon: <CreditCard className="w-5 h-5 mr-3" />, roles: ['ROLE_ADMIN', 'ADMIN', 'ROLE_RECEPTIONIST', 'RECEPTIONIST'] },
    { path: '/dashboard/hr/shifts', label: 'Quản lý Ca làm', icon: <Clock className="w-5 h-5 mr-3" />, roles: ['ROLE_ADMIN', 'ADMIN', 'ROLE_MANAGER', 'MANAGER'] },
    { path: '/dashboard/hr/my-schedule', label: 'Lịch làm việc của tôi', icon: <Calendar className="w-5 h-5 mr-3" />, roles: ['ROLE_RECEPTIONIST', 'RECEPTIONIST', 'ROLE_MECHANIC', 'MECHANIC'] },
  ];

  const menuItems = menuConfig.filter(item => item.roles.includes(userRole));

  // Page titles
  const getPageTitle = () => {
    if (location.pathname === '/dashboard') return 'Quản lý Điều phối & Sửa chữa';
    if (location.pathname.startsWith('/dashboard/appointments')) return 'Quản lý Lịch hẹn khách hàng';
    if (location.pathname.startsWith('/dashboard/customers')) return 'Quản lý Khách hàng & Xe';
    if (location.pathname.startsWith('/dashboard/inventory')) return 'Quản lý Kho vật tư';
    if (location.pathname.startsWith('/dashboard/services')) return 'Quản lý Danh mục Dịch vụ';
    if (location.pathname.startsWith('/dashboard/billing')) return 'Thanh toán & Hóa đơn';
    if (location.pathname.startsWith('/dashboard/create-order')) return 'Tạo phiếu sửa chữa mới';
    if (location.pathname.startsWith('/dashboard/admin')) return 'Bảng điều khiển Quản trị';
    if (location.pathname.startsWith('/dashboard/hr/shifts')) return 'Quản lý Nhân sự & Ca làm';
    if (location.pathname.startsWith('/dashboard/hr/my-schedule')) return 'Lịch làm việc của tôi';
    return 'Dashboard';
  };

  const canCreateOrder = ['ROLE_ADMIN', 'ADMIN', 'ROLE_MANAGER', 'MANAGER'].includes(userRole);

  return (
    <div className="flex h-screen bg-gray-50 text-slate-800">
      {/* Sidebar bên trái */}
      <aside className="flex flex-col justify-between w-64 bg-white border-r">
        <div>
          <div className="p-6 text-xl font-bold text-blue-900 border-b">AutoFlow Pro</div>
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              item.path === '#' ? (
                <a key={item.label} href="#" className={`${baseStyle} ${inactiveStyle}`}>
                  {item.icon} {item.label}
                </a>
              ) : (
                <Link key={item.path} to={item.path} className={`${baseStyle} ${isActive(item.path) ? activeStyle : inactiveStyle}`}>
                  {item.icon} {item.label}
                </Link>
              )
            ))}
            
            {/* Conditional Admin Menu */}
            {(role && ['ROLE_ADMIN', 'ROLE_MANAGER', 'ADMIN', 'MANAGER'].includes(role.toUpperCase())) && (
              <Link to="/dashboard/admin" className={`${baseStyle} ${isActive('/dashboard/admin') ? activeStyle : inactiveStyle}`}>
                <Settings className="w-5 h-5 mr-3"/> Quản trị
              </Link>
            )}
          </nav>
        </div>
        <div className="p-4 border-t">
          {canCreateOrder && (
            <Link to="/dashboard/create-order" className="flex items-center justify-center w-full p-3 mb-4 text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition">
              <PlusCircle className="w-5 h-5 mr-2"/> Tạo phiếu mới
            </Link>
          )}
          <div className="space-y-3 text-sm text-gray-500 mb-4">
            <a href="#" className="flex items-center hover:text-gray-900"><HelpCircle className="w-4 h-4 mr-3"/> Hỗ trợ</a>
          </div>
          
          {/* Nút đăng xuất */}
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="flex items-center justify-center w-full p-3 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition font-medium"
          >
            <LogOut className="w-4 h-4 mr-2" /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Khu vực nội dung chính bên phải */}
      <main className="flex flex-col flex-1 overflow-hidden">
        {/* Thanh Header trên cùng */}
        <header className="flex items-center justify-between p-6 bg-white border-b">
          <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
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