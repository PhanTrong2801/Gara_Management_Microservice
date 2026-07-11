import { useState, useEffect } from 'react';
import { Clock, Wrench, CheckCircle, AlertTriangle, Play, ChevronDown, Search, Eye, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import RepairOrderDetailsModal from './RepairOrderDetailsModal';
import { useTablePagination } from '../../hooks/useTablePagination';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useMemo } from 'react';

const STATUS_CONFIG = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  DIAGNOSING: { label: 'Chẩn đoán', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  QUOTING: { label: 'Báo giá', color: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  APPROVED: { label: 'Đã duyệt giá', color: 'bg-cyan-100 text-cyan-800', dot: 'bg-cyan-500' },
  REPAIRING: { label: 'Đang sửa', color: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
};

const STATUS_FLOW = ['PENDING', 'DIAGNOSING', 'QUOTING', 'APPROVED', 'REPAIRING', 'COMPLETED'];

export default function RepairManagement() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  // Server-side pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, debouncedSearch]);

  // Tự động Polling (Hỏi thăm Backend) mỗi 3s nếu có phiếu đang chờ kho
  useEffect(() => {
    const hasWaitingInventory = orders.some(o => o.status === 'WAITING_INVENTORY');
    if (!hasWaitingInventory) return;

    const intervalId = setInterval(() => {
      // Fetch ngầm không bật loading để tránh giật UI
      api.get(`/repair/orders?page=${currentPage - 1}&size=10&search=${debouncedSearch}&sort=createdAt,desc`)
        .then(response => {
          setOrders(response.data.content || []);
          const pageMeta = response.data.page || response.data;
          setTotalPages(pageMeta.totalPages || 1);
          setTotalItems(pageMeta.totalElements || 0);
        })
        .catch(err => console.error("Lỗi khi polling danh sách:", err));
    }, 3000); // 3 giây kiểm tra 1 lần

    return () => clearInterval(intervalId); // Cleanup khi component unmount hoặc effect chạy lại
  }, [orders, currentPage, debouncedSearch]);

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

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/repair/orders/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data || 'Cập nhật trạng thái thất bại!';
      alert(errorMsg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleGenerateInvoice = async (order) => {
    try {
      setUpdatingId(order.id);
      await api.post('/billing/invoices', { repairOrderNumber: order.orderNumber });
      alert('Đã tạo hóa đơn thành công!');
      navigate('/dashboard/billing');
    } catch (error) {
      console.error('Lỗi tạo hóa đơn:', error);
      alert('Hóa đơn cho phiếu này có thể đã được tạo hoặc xảy ra lỗi.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getNextStatus = (currentStatus) => {
    if (currentStatus === 'WAITING_INVENTORY') return null;
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx !== -1 && idx < STATUS_FLOW.length - 1) return STATUS_FLOW[idx + 1];
    return null;
  };

  const statusFilteredOrders = useMemo(() => {
    if (filterStatus === 'ALL') return orders;
    return orders.filter(o => o.status === filterStatus);
  }, [orders, filterStatus]);

  // Count by status
  const statusCounts = STATUS_FLOW.reduce((acc, status) => {
    acc[status] = orders.filter(o => o.status === status).length;
    return acc;
  }, {});

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Đang đồng bộ dữ liệu...</div>;

  return (
    <div className="space-y-6">
      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {STATUS_FLOW.map(status => {
          const config = STATUS_CONFIG[status];
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? 'ALL' : status)}
              className={`p-4 rounded-xl border transition-all text-left ${filterStatus === status
                  ? 'border-blue-500 ring-2 ring-blue-200 bg-white shadow-md'
                  : 'border-gray-100 bg-white hover:shadow-sm'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className={`w-3 h-3 rounded-full ${config.dot}`}></span>
                <span className="text-2xl font-bold text-gray-800">{statusCounts[status] || 0}</span>
              </div>
              <p className="text-xs font-medium text-gray-500 mt-2">{config.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm mã phiếu, người tạo..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none text-sm"
          />
        </div>
        {filterStatus !== 'ALL' && (
          <button
            onClick={() => setFilterStatus('ALL')}
            className="px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition font-medium"
          >
            Xóa bộ lọc
          </button>
        )}
        <span className="text-sm text-gray-500 ml-auto">
          Hiển thị {totalItems} / {orders.length} phiếu
        </span>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Mã phiếu</th>
                <th className="px-6 py-4">Thông tin xe</th>
                <th className="px-6 py-4">Ghi chú kiểm tra</th>
                <th className="px-6 py-4">Người tạo / Thời gian</th>
                <th className="px-6 py-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {statusFilteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <AlertTriangle className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                    Không tìm thấy phiếu sửa chữa nào.
                  </td>
                </tr>
              ) : (
                statusFilteredOrders.map(order => {
                  const config = STATUS_CONFIG[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-800', dot: 'bg-gray-500' };
                  const nextStatus = getNextStatus(order.status);
                  const nextConfig = nextStatus ? STATUS_CONFIG[nextStatus] : null;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${config.color}`}>
                          <span className={`w-2 h-2 mr-2 rounded-full ${config.dot}`}></span>
                          {config.label}
                        </span>
                      </td>

                      {/* Order Number */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{order.orderNumber}</div>
                      </td>

                      {/* Car Info */}
                      <td className="px-6 py-4">
                        <div className="text-gray-700">Xe ID: <span className="font-medium">{order.carId}</span></div>
                        <div className="text-xs text-gray-500 mt-1 flex gap-3">
                          <span>ODO: {order.checkInInfo?.odo || '—'} km</span>
                          <span>Xăng: {order.checkInInfo?.fuelLevel || '—'}</span>
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 truncate max-w-[200px]" title={order.checkInInfo?.scratches}>
                          {order.checkInInfo?.scratches || 'Không có ghi chú'}
                        </p>
                      </td>

                      {/* Creator & Time */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{order.createdBy}</div>
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(order.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            <Eye className="w-3 h-3" /> Chi tiết
                          </button>

                          {nextStatus ? (
                            <button
                              disabled={updatingId === order.id}
                              onClick={() => handleUpdateStatus(order.id, nextStatus)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${nextConfig.color} hover:opacity-80`}
                            >
                              {updatingId === order.id ? (
                                '...'
                              ) : (
                                <>
                                  <Play className="w-3 h-3" />
                                  {nextConfig.label}
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              disabled={updatingId === order.id}
                              onClick={() => handleGenerateInvoice(order)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                              {updatingId === order.id ? '...' : <><FileText className="w-3 h-3" /> Xuất hóa đơn</>}
                            </button>
                          )}
                        </div>
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

      {/* Modal Chi tiết */}
      <RepairOrderDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        onSaveSuccess={() => {
          setIsModalOpen(false);
          fetchOrders(); // Tải lại danh sách sau khi lưu thành công
        }}
      />
    </div>
  );
}
