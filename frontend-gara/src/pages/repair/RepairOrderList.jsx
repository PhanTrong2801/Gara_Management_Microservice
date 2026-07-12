import { useState, useEffect } from 'react';
import { Clock, MoreVertical, AlertCircle, Search } from 'lucide-react';
import api from '../../api/axiosConfig';
import { useTablePagination } from '../../hooks/useTablePagination';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';

const STATUS_CONFIG = {
    'PENDING': { label: 'Chờ nhận xe', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
    'RECEIVED': { label: 'Chờ nhận xe', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
    'DIAGNOSING': { label: 'Đang chẩn đoán', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
    'QUOTING': { label: 'Đang báo giá', color: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
    'APPROVED': { label: 'Đã duyệt giá', color: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500' },
    'REPAIRING': { label: 'Đang sửa chữa', color: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
    'COMPLETED': { label: 'Hoàn thành', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
    'CANCELLED': { label: 'Đã hủy', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
};

export default function RepairOrderList() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Server-side pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const debouncedSearch = useDebounce(searchTerm, 500);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/repair/orders?page=${currentPage - 1}&size=10&search=${debouncedSearch}&sort=createdAt,desc`);
                setOrders(response.data.content || []);
                const pageMeta = response.data.page || response.data;
                setTotalPages(pageMeta.totalPages || 1);
                setTotalItems(pageMeta.totalElements || 0);
            } catch (error) {
                console.error("Lỗi khi tải danh sách:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [currentPage, debouncedSearch]);

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Đang đồng bộ dữ liệu với máy chủ...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">Xe đang trong khu vực tiếp nhận</h2>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm phiếu / mã xe / khách hàng..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        />
                    </div>
                    <span className="px-3 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                        Tổng cộng: {totalItems} xe
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">TRẠNG THÁI</th>
                            <th className="px-6 py-4">MÃ PHIẾU / XE</th>
                            <th className="px-6 py-4">KHÁCH HÀNG</th>
                            <th className="px-6 py-4">TÌNH TRẠNG & GHI CHÚ</th>
                            <th className="px-6 py-4">THỜI GIAN / NGƯỜI TẠO</th>
                            <th className="px-6 py-4 text-center">THAO TÁC</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                    <AlertCircle className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                                    Chưa có phiếu tiếp nhận nào trong hệ thống.
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                                    {/* Cột Trạng thái */}
                                    <td className="px-6 py-4">
                                        {(() => {
                                            const config = STATUS_CONFIG[order.status] || { label: order.status, color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500' };
                                            return (
                                                <span className={`flex items-center w-max px-2.5 py-1 text-xs font-semibold ${config.color} rounded-full`}>
                                                    <span className={`w-2 h-2 mr-2 ${config.dot} rounded-full`}></span>
                                                    {config.label}
                                                </span>
                                            );
                                        })()}
                                    </td>

                                    {/* Cột Mã phiếu */}
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">{order.orderNumber}</div>
                                        <div className="text-xs text-gray-500 mt-1">Xe ID: {order.carId}</div>
                                    </td>

                                    {/* Cột Khách hàng */}
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">Khách ID: {order.customerId}</div>
                                    </td>

                                    {/* Cột Tình trạng */}
                                    <td className="px-6 py-4">
                                        <div className="truncate w-56 font-medium text-gray-800" title={order.checkInInfo?.scratches}>
                                            {order.checkInInfo?.scratches || "Không có ghi chú bất thường"}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 flex space-x-3">
                                            <span>ODO: {order.checkInInfo?.odo} km</span>
                                            <span>Xăng: {order.checkInInfo?.fuelLevel}</span>
                                        </div>
                                    </td>

                                    {/* Cột Thời gian & Người tạo */}
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-800">{order.createdBy}</div>
                                        <div className="text-xs text-gray-500 flex items-center mt-1">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                        </div>
                                    </td>

                                    {/* Cột Hành động */}
                                    <td className="px-6 py-4 text-center">
                                        <button className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
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
    );
}