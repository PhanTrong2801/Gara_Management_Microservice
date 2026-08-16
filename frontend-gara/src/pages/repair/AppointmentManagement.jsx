import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Search, Clock, FileText } from 'lucide-react';
import api from '../../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { useTablePagination } from '../../hooks/useTablePagination';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast';

const AppointmentManagement = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [customersMap, setCustomersMap] = useState({});
    const navigate = useNavigate();

    // Server-side pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const debouncedSearch = useDebounce(searchTerm, 500);

    const role = localStorage.getItem('role') || '';
    const canCreateOrder = ['ROLE_ADMIN', 'ADMIN', 'ROLE_MANAGER', 'MANAGER'].includes(role.toUpperCase());

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            // 1. Lấy danh sách lịch hẹn
            const res = await api.get(`/repair/appointments?page=${currentPage - 1}&size=10&search=${debouncedSearch}&sort=createdAt,desc`);
            const dataList = res.data.content || [];
            setAppointments(dataList);
            const pageMeta = res.data.page || res.data;
            setTotalPages(pageMeta.totalPages || 1);
            setTotalItems(pageMeta.totalElements || 0);

            // 2. Lấy thông tin khách hàng để map tên
            const customerIds = [...new Set(dataList.map(a => a.customerId))];
            if (customerIds.length > 0) {
                const customerPromises = customerIds.map(id => api.get(`/customers/${id}`));
                const responses = await Promise.all(customerPromises);
                
                const map = {};
                responses.forEach(res => {
                    const c = res.data;
                    if (c && c.id) map[c.id] = c;
                });
                setCustomersMap(map);
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách lịch hẹn:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [currentPage, debouncedSearch]);

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.put(`/repair/appointments/${id}/status`, { status: status });
            // Refresh
            fetchAppointments();
        } catch (error) {
            console.error("Lỗi cập nhật trạng thái:", error);
            toast.error("Lỗi cập nhật trạng thái lịch hẹn.");
        }
    };

    const handleCreateRepairOrder = (appt) => {
        const customer = customersMap[appt.customerId];
        if (!customer) {
            toast.error("Không tìm thấy thông tin khách hàng, không thể tạo phiếu.");
            return;
        }

        // Điều hướng sang trang Tạo phiếu sửa chữa, truyền sẵn dữ liệu
        navigate('/dashboard/create-order', {
            state: {
                prefillCustomerPhone: customer.phoneNumber,
                prefillDescription: appt.description
            }
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING': return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold flex items-center w-max"><Clock size={14} className="mr-1" /> Chờ xác nhận</span>;
            case 'CONFIRMED': return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold flex items-center w-max"><CheckCircle size={14} className="mr-1" /> Đã xác nhận</span>;
            case 'CANCELLED': return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold flex items-center w-max"><XCircle size={14} className="mr-1" /> Đã hủy</span>;
            default: return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
        }
    };



    if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Đang tải dữ liệu...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý Lịch hẹn</h1>
                    <p className="text-sm text-slate-500 mt-1">Duyệt và tiếp nhận xe từ khách hàng đặt trước</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div className="relative w-96">
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, SĐT khách hoặc mô tả..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Khách hàng</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày hẹn</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Yêu cầu / Mô tả</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {appointments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        Không tìm thấy lịch hẹn nào.
                                    </td>
                                </tr>
                            ) : (
                                appointments.map((appt) => {
                                    const customer = customersMap[appt.customerId] || {};
                                    return (
                                        <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-800">{customer.fullName || 'Khách vãng lai'}</div>
                                                <div className="text-sm text-slate-500">{customer.phoneNumber || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-800">{new Date(appt.appointmentDate).toLocaleDateString('vi-VN')}</div>
                                                <div className="text-xs text-slate-500">Tạo lúc: {new Date(appt.createdAt).toLocaleString('vi-VN')}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-700 max-w-xs truncate" title={appt.description}>
                                                    {appt.description}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(appt.status)}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                {appt.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                                                            className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md text-sm font-medium transition"
                                                        >
                                                            Xác nhận
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(appt.id, 'CANCELLED')}
                                                            className="text-slate-600 bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded-md text-sm font-medium transition"
                                                        >
                                                            Từ chối
                                                        </button>
                                                    </>
                                                )}
                                                {appt.status === 'CONFIRMED' && canCreateOrder && (
                                                    <button
                                                        onClick={() => handleCreateRepairOrder(appt)}
                                                        className="text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center justify-center ml-auto"
                                                    >
                                                        <FileText size={16} className="mr-1" /> Tạo Phiếu
                                                    </button>
                                                )}
                                                {appt.status === 'CANCELLED' && (
                                                    <span className="text-slate-400 text-sm italic">Đã đóng</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
};

export default AppointmentManagement;
