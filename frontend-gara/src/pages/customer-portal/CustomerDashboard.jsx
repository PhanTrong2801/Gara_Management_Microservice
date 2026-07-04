import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Calendar, FileText, ArrowRight, User } from 'lucide-react';
import axios from 'axios';
import ProfileUpdateModal from './ProfileUpdateModal';

const CustomerDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [showModal, setShowModal] = useState(false);
    
    const [stats, setStats] = useState({
        activeRepairs: 0,
        upcomingAppointments: 0,
        unpaidInvoices: 0
    });

    const fetchDashboardData = async (customerId) => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            const [ordersRes, apptsRes, invoicesRes] = await Promise.all([
                axios.get(`http://localhost:8080/api/repair/orders/customer/${customerId}`, { headers }).catch(() => ({data: []})),
                axios.get(`http://localhost:8080/api/repair/appointments/customer/${customerId}`, { headers }).catch(() => ({data: []})),
                axios.get(`http://localhost:8080/api/billing/invoices/customer/${customerId}`, { headers }).catch(() => ({data: []}))
            ]);
            
            const activeRepairsCount = (ordersRes.data.content || ordersRes.data || []).filter(o => o.status !== 'COMPLETED').length;
            const upcomingApptsCount = (apptsRes.data.content || apptsRes.data || []).filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED').length;
            const unpaidInvoicesCount = (invoicesRes.data.content || invoicesRes.data || []).filter(i => i.status !== 'PAID').length;
            
            setStats({
                activeRepairs: activeRepairsCount,
                upcomingAppointments: upcomingApptsCount,
                unpaidInvoices: unpaidInvoicesCount
            });
            
        } catch (error) {
            console.error("Lỗi lấy dữ liệu thống kê:", error);
        }
    };

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:8080/api/customers/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(res.data);
            localStorage.setItem('customerId', res.data.id);
            
            if (res.data.phoneNumber === 'N/A' || !res.data.vehicles || res.data.vehicles.length === 0) {
                setShowModal(true);
            } else {
                setShowModal(false);
            }
            
            fetchDashboardData(res.data.id);
            
        } catch (error) {
            console.error("Lỗi lấy thông tin:", error);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleUpdateComplete = () => {
        setShowModal(false);
        fetchProfile();
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {showModal && profile && (
                <ProfileUpdateModal profile={profile} onUpdateComplete={handleUpdateComplete} />
            )}

            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-8 shadow-lg text-white relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-white/20 p-2 rounded-full">
                            <User size={24} />
                        </div>
                        <h2 className="text-3xl font-bold">Xin chào, {profile?.fullName || 'Khách hàng'}!</h2>
                    </div>
                    <p className="text-blue-100 max-w-xl text-lg mt-2">
                        Chào mừng bạn trở lại AutoFlow. Hệ thống đã sẵn sàng phục vụ các yêu cầu của bạn.
                    </p>
                </div>
                {/* Decorative background circle */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <Wrench className="text-blue-600" size={24} />
                            </div>
                            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Hoạt động</span>
                        </div>
                        <h3 className="text-slate-500 font-medium text-sm">Xe đang sửa chữa</h3>
                        <p className="text-4xl font-black text-slate-800 mt-1">{stats.activeRepairs}</p>
                    </div>
                    <Link to="/customer/tracking" className="mt-6 flex items-center justify-center space-x-2 w-full text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white py-3 rounded-xl font-semibold transition-all duration-200">
                        <span>Xem chi tiết</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-green-100 p-3 rounded-xl">
                                <Calendar className="text-green-600" size={24} />
                            </div>
                            <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Sắp tới</span>
                        </div>
                        <h3 className="text-slate-500 font-medium text-sm">Lịch hẹn</h3>
                        <p className="text-4xl font-black text-slate-800 mt-1">{stats.upcomingAppointments}</p>
                    </div>
                    <Link to="/customer/booking" className="mt-6 flex items-center justify-center space-x-2 w-full text-green-600 bg-green-50 hover:bg-green-600 hover:text-white py-3 rounded-xl font-semibold transition-all duration-200">
                        <span>Quản lý lịch</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-orange-100 p-3 rounded-xl">
                                <FileText className="text-orange-600" size={24} />
                            </div>
                            <span className="bg-orange-50 text-orange-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Chưa thanh toán</span>
                        </div>
                        <h3 className="text-slate-500 font-medium text-sm">Hóa đơn cần xử lý</h3>
                        <p className="text-4xl font-black text-slate-800 mt-1">{stats.unpaidInvoices}</p>
                    </div>
                    <Link to="/customer/billing" className="mt-6 flex items-center justify-center space-x-2 w-full text-orange-600 bg-orange-50 hover:bg-orange-600 hover:text-white py-3 rounded-xl font-semibold transition-all duration-200">
                        <span>Xem hóa đơn</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CustomerDashboard;
