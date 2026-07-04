import { useState, useEffect } from 'react';
import { Clock, MoreVertical, AlertCircle, Search } from 'lucide-react';
import api from '../../api/axiosConfig';
import { useTablePagination } from '../../hooks/useTablePagination';
import Pagination from '../../components/common/Pagination';

export default function RepairOrderList() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const {
        currentData: currentOrders,
        currentPage,
        totalPages,
        searchTerm,
        setSearchTerm,
        handlePageChange,
        totalItems
    } = useTablePagination(orders, (order, term) => 
        order.orderNumber?.toLowerCase().includes(term) ||
        order.carId?.toString().toLowerCase().includes(term) ||
        order.customerId?.toString().toLowerCase().includes(term)
    );

    // Hook này tự động chạy 1 lần khi màn hình vừa hiển thị lên
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await api.get('/repair/orders');
                setOrders(response.data.content || response.data || []); // Đưa data từ backend vào state của React
            } catch (error) {
                console.error("Lỗi khi tải danh sách:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

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
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        />
                    </div>
                    <span className="px-3 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                        Tổng cộng: {orders.length} xe
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
                    {currentOrders.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                <AlertCircle className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                                Chưa có phiếu tiếp nhận nào trong hệ thống.
                            </td>
                        </tr>
                    ) : (
                        currentOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                                {/* Cột Trạng thái */}
                                <td className="px-6 py-4">
                    <span className="flex items-center w-max px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded-full">
                      <span className="w-2 h-2 mr-2 bg-slate-500 rounded-full"></span>
                        {order.status}
                    </span>
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
                onPageChange={handlePageChange} 
            />
        </div>
    );
}