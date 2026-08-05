import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Wrench, Calendar, FileText, LogOut, CarFront } from 'lucide-react';

const CustomerLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/');
    };

    const navItems = [
        { path: '/customer', icon: <Home size={18} />, label: 'Trang chủ' },
        { path: '/customer/tracking', icon: <Wrench size={18} />, label: 'Tiến độ sửa xe' },
        { path: '/customer/booking', icon: <Calendar size={18} />, label: 'Đặt lịch hẹn' },
        { path: '/customer/billing', icon: <FileText size={18} />, label: 'Hóa đơn' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
            {/* Premium Navbar with Glassmorphism */}
            <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-8">
                            <div className="flex items-center space-x-2">
                                <div className="bg-blue-600 p-2 rounded-lg">
                                    <CarFront className="text-white" size={24} />
                                </div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                    Auto<span className="text-blue-600">Flow</span>
                                </h1>
                            </div>

                            <div className="hidden md:flex space-x-1">
                                {navItems.map((item) => {
                                    const isActive = location.pathname === item.path ||
                                        (item.path !== '/customer' && location.pathname.startsWith(item.path));
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                }`}
                                        >
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                <LogOut size={18} />
                                <span>Đăng xuất</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 mt-auto">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <p className="text-slate-500 text-sm">© 2026 AutoFlow Gara Management.</p>
                    <p className="text-slate-400 text-sm">Dành riêng cho khách hàng</p>
                </div>
            </footer>
        </div>
    );
};

export default CustomerLayout;
