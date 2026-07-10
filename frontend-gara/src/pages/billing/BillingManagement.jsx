import React, { useState, useEffect, useMemo } from 'react';
import { CreditCard, Search, FileText, CheckCircle, Clock, Eye } from 'lucide-react';
import api from '../../api/axiosConfig';
import InvoiceDetailsModal from './InvoiceDetailsModal';
import { useTablePagination } from '../../hooks/useTablePagination';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';

export default function BillingManagement() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Server-side pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  // State cho Modal Hóa đơn
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [currentPage, debouncedSearch]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/billing/invoices?page=${currentPage - 1}&size=10&search=${debouncedSearch}&sort=createdAt,desc`);
      setInvoices(response.data.content || []);
      const pageMeta = response.data.page || response.data;
      setTotalPages(pageMeta.totalPages || 1);
      setTotalItems(pageMeta.totalElements || 0);
    } catch (error) {
      console.error('Lỗi khi tải hóa đơn:', error);
    } finally {
      setLoading(false);
    }
  };

  const openInvoiceDetails = async (invoiceNumber) => {
    try {
      const response = await api.get(`/billing/invoices/${invoiceNumber}`);
      setSelectedInvoice(response.data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Lỗi khi tải chi tiết hóa đơn:', error);
      alert('Không thể tải chi tiết hóa đơn!');
    }
  };

  const handlePaymentSuccess = () => {
    setIsModalOpen(false);
    fetchInvoices();
  };

  const statusFilteredInvoices = useMemo(() => {
    if (filterStatus === 'ALL') return invoices;
    return invoices.filter(i => i.status === filterStatus);
  }, [invoices, filterStatus]);

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Đang đồng bộ dữ liệu hóa đơn...</div>;

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-gray-500 font-medium">Tổng số hóa đơn</div>
            <div className="text-2xl font-bold text-gray-800">{invoices.length}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-gray-500 font-medium">Đã thanh toán</div>
            <div className="text-2xl font-bold text-gray-800">
              {invoices.filter(i => i.status === 'PAID').length}
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-lg text-yellow-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm text-gray-500 font-medium">Chưa thanh toán</div>
            <div className="text-2xl font-bold text-gray-800">
              {invoices.filter(i => i.status === 'UNPAID').length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo mã hóa đơn, mã phiếu sửa..."
            value={searchTerm}
            onChange={(e) => {
               setSearchTerm(e.target.value);
               setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
          />
        </div>
        <select 
          className="border rounded-lg px-4 py-2 bg-white"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="UNPAID">Chưa thanh toán</option>
          <option value="PAID">Đã thanh toán</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b text-gray-500">
            <tr>
              <th className="px-6 py-4 font-medium">Mã Hóa Đơn</th>
              <th className="px-6 py-4 font-medium">Mã Phiếu Sửa</th>
              <th className="px-6 py-4 font-medium text-right">Tổng Tiền (VNĐ)</th>
              <th className="px-6 py-4 font-medium text-center">Trạng thái</th>
              <th className="px-6 py-4 font-medium text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {statusFilteredInvoices.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">Không có hóa đơn nào.</td></tr>
            ) : (
              statusFilteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-semibold text-gray-800">{inv.invoiceNumber}</td>
                  <td className="px-6 py-4 text-gray-600">{inv.repairOrderNumber}</td>
                  <td className="px-6 py-4 font-bold text-blue-600 text-right">
                    {(inv.totalAmount || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {inv.status === 'PAID' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-semibold">
                        <CheckCircle className="w-3 h-3" /> Đã thanh toán
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full font-semibold">
                        <Clock className="w-3 h-3" /> Chưa thanh toán
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => openInvoiceDetails(inv.invoiceNumber)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg mx-auto transition ${
                        inv.status === 'UNPAID' 
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {inv.status === 'UNPAID' ? (
                        <><CreditCard className="w-3 h-3" /> Chi tiết & Thu tiền</>
                      ) : (
                        <><Eye className="w-3 h-3" /> Xem Hóa đơn</>
                      )}
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

      {/* Modal Xem chi tiết và In hóa đơn */}
      <InvoiceDetailsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        invoice={selectedInvoice}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
