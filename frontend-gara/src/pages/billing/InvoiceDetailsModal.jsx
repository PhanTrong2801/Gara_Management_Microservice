import React, { useRef, useState, useEffect } from 'react';
import { X, Printer, CreditCard, Banknote, AlertTriangle } from 'lucide-react';
import api from '../../api/axiosConfig';
import toast from 'react-hot-toast';
import { useConfirm } from '../../context/ConfirmContext';

export default function InvoiceDetailsModal({ isOpen, onClose, invoice, onPaymentSuccess }) {
  const printRef = useRef();
  
  const [servicesMap, setServicesMap] = useState({});
  const [partsMap, setPartsMap] = useState({});
  
  // State lưu trữ dữ liệu chi tiết
  const [fullOrder, setFullOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    if (isOpen && invoice) {
      fetchData();
    }
  }, [isOpen, invoice]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [svcRes, partsRes, orderRes] = await Promise.all([
        api.get('/repair/service-catalog'),
        api.get('/inventory/parts'),
        api.get(`/repair/orders/${invoice.repairOrderNumber}`)
      ]);
      
      const sMap = {};
      const svcList = svcRes.data.content || svcRes.data || [];
      svcList.forEach(s => { sMap[s.id] = s.name; });
      setServicesMap(sMap);

      const pMap = {};
      const partsList = partsRes.data.content || partsRes.data || [];
      partsList.forEach(p => { pMap[p.id] = p.name; });
      setPartsMap(pMap);

      const orderData = orderRes.data;
      setFullOrder(orderData);

      // Lấy thông tin khách hàng và xe
      if (orderData.customerId) {
          const custRes = await api.get(`/customers/${orderData.customerId}`);
          setCustomer(custRes.data);
          
          if (custRes.data.vehicles && orderData.carId) {
              const matchedVehicle = custRes.data.vehicles.find(v => v.id === orderData.carId);
              setVehicle(matchedVehicle);
          }
      }

    } catch (error) {
      console.error("Lỗi tải dữ liệu hóa đơn:", error);
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen || !invoice) return null;

  // Tách data từ fullOrder
  const tasks = fullOrder?.tasks || [];
  const parts = fullOrder?.parts || [];

  const handlePrint = () => {
    const printContent = printRef.current;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // Reload lại trang để phục hồi React DOM
  };

  const handlePayCash = async () => {
    const isConfirmed = await confirm({
      title: 'Xác nhận thanh toán',
      message: `Bạn có chắc chắn muốn xác nhận thu TIỀN MẶT cho hóa đơn ${invoice.invoiceNumber}?`
    });

    if (isConfirmed) {
      try {
        await api.post(`/billing/invoices/${invoice.invoiceNumber}/pay`, { paymentMethod: 'CASH' });
        toast.success('Thanh toán Tiền mặt thành công!');
        onPaymentSuccess();
      } catch (error) {
        console.error('Lỗi thanh toán:', error);
        toast.error('Lỗi khi thanh toán: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handlePayOnline = async () => {
    try {
      const response = await api.post('/billing/vnpay/create-payment', { invoiceNumber: invoice.invoiceNumber });
      if (response.data.paymentUrl) {
          window.location.href = response.data.paymentUrl;
      }
    } catch (error) {
      console.error("Lỗi khởi tạo thanh toán VNPay:", error);
      toast.error("Không thể khởi tạo thanh toán VNPay lúc này.");
    }
  };

  // Thu thập ghi chú của thợ
  const mechanicNotes = tasks.filter(t => t.mechanicNote).map(t => `${servicesMap[t.serviceCatalogId] || 'Dịch vụ'}: ${t.mechanicNote}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 print:hidden">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Chi tiết Hóa Đơn: {invoice.invoiceNumber}</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="In Hóa Đơn">
              <Printer size={20} />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Nội dung Hóa đơn (Phần này sẽ được In) */}
        {loading ? (
            <div className="flex-1 p-8 text-center text-slate-500 animate-pulse">Đang tải chi tiết hóa đơn...</div>
        ) : (
        <div className="flex-1 overflow-y-auto p-8" ref={printRef}>
            <div className="max-w-3xl mx-auto bg-white">
                {/* Header Hóa đơn in */}
                <div className="text-center mb-8 border-b-2 border-dashed border-slate-200 pb-6">
                    <h1 className="text-2xl font-black text-slate-800 uppercase">GARA AUTO CARE PRO</h1>
                    <p className="text-slate-500 mt-1">Đ/c: 123 Đường Tôn Đức Thắng, Q1, TP.HCM</p>
                    <p className="text-slate-500">SĐT: 0988.888.888 - Web: gara-autocare.vn</p>
                    <h2 className="text-xl font-bold text-slate-800 mt-6 uppercase">Hóa Đơn Thanh Toán</h2>
                    <p className="text-sm font-medium text-slate-500">Số: {invoice.invoiceNumber}</p>
                </div>

                {/* Thông tin khách hàng & Xe */}
                <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
                    <div>
                        <p><span className="font-semibold text-slate-700 w-24 inline-block">Khách hàng:</span> {customer?.fullName || 'Khách vãng lai'}</p>
                        <p><span className="font-semibold text-slate-700 w-24 inline-block">Số ĐT:</span> {customer?.phoneNumber || 'N/A'}</p>
                    </div>
                    <div>
                        <p><span className="font-semibold text-slate-700 w-24 inline-block">Biển số xe:</span> <span className="font-bold border border-slate-300 px-2 py-0.5 rounded uppercase">{vehicle?.licensePlate || 'N/A'}</span></p>
                        <p><span className="font-semibold text-slate-700 w-24 inline-block">Dòng xe:</span> {vehicle?.brand} {vehicle?.model}</p>
                        <p><span className="font-semibold text-slate-700 w-24 inline-block">Mã Phiếu sửa:</span> {invoice.repairOrderNumber}</p>
                    </div>
                </div>

                {/* Danh sách Công việc */}
                <div className="mb-6">
                    <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">1. Tiền công & Dịch vụ</h3>
                    <table className="w-full text-sm">
                        <thead className="text-slate-500 bg-slate-50">
                            <tr>
                                <th className="text-left py-2 px-2">Nội dung</th>
                                <th className="text-right py-2 px-2">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {tasks.map((t, idx) => (
                                <tr key={idx}>
                                    <td className="py-2 px-2">{servicesMap[t.serviceCatalogId] || `Dịch vụ #${t.serviceCatalogId}`}</td>
                                    <td className="text-right py-2 px-2">{(t.cost || 0).toLocaleString()} đ</td>
                                </tr>
                            ))}
                            {tasks.length === 0 && <tr><td colSpan="2" className="py-2 px-2 text-center text-slate-400">Không có dịch vụ</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* Danh sách Phụ tùng */}
                <div className="mb-8">
                    <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">2. Vật tư & Phụ tùng</h3>
                    <table className="w-full text-sm">
                        <thead className="text-slate-500 bg-slate-50">
                            <tr>
                                <th className="text-left py-2 px-2">Tên phụ tùng</th>
                                <th className="text-center py-2 px-2">SL</th>
                                <th className="text-right py-2 px-2">Đơn giá</th>
                                <th className="text-right py-2 px-2">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {parts.map((p, idx) => (
                                <tr key={idx}>
                                    <td className="py-2 px-2">{partsMap[p.partId] || `Phụ tùng #${p.partId}`}</td>
                                    <td className="text-center py-2 px-2">{p.quantity || 1}</td>
                                    <td className="text-right py-2 px-2">{(p.unitPrice || 0).toLocaleString()} đ</td>
                                    <td className="text-right py-2 px-2">{((p.quantity || 1) * (p.unitPrice || 0)).toLocaleString()} đ</td>
                                </tr>
                            ))}
                            {parts.length === 0 && <tr><td colSpan="4" className="py-2 px-2 text-center text-slate-400">Không dùng phụ tùng</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* Ghi chú của thợ */}
                {mechanicNotes.length > 0 && (
                    <div className="mb-8 bg-orange-50 border border-orange-100 p-4 rounded-lg">
                        <h3 className="font-bold text-orange-800 flex items-center text-sm mb-2">
                            <AlertTriangle className="w-4 h-4 mr-1" /> Khuyến cáo kỹ thuật (Từ thợ máy)
                        </h3>
                        <ul className="list-disc pl-5 text-sm text-orange-700 space-y-1">
                            {mechanicNotes.map((note, idx) => (
                                <li key={idx}>{note}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Tổng tiền */}
                <div className="flex justify-end border-t-2 border-slate-800 pt-4 mt-8">
                    <div className="w-64">
                        <div className="flex justify-between font-black text-xl text-blue-700">
                            <span>TỔNG CỘNG:</span>
                            <span>{invoice.totalAmount?.toLocaleString()} VNĐ</span>
                        </div>
                        {invoice.status === 'PAID' && (
                            <div className="text-center text-green-600 font-bold border-2 border-green-600 rounded mt-4 py-2 uppercase transform rotate-[-5deg]">
                                ĐÃ THANH TOÁN
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center mt-12 text-sm text-slate-500 italic pb-8">
                    Cảm ơn quý khách đã sử dụng dịch vụ của Gara!
                </div>
            </div>
        </div>
        )}

        {/* Footer Actions (Chỉ hiện khi chưa thanh toán) */}
        {invoice.status === 'UNPAID' && !loading && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 print:hidden">
                <button 
                    onClick={handlePayCash}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold transition flex items-center shadow-lg shadow-emerald-200"
                >
                    <Banknote size={20} className="mr-2" />
                    Thu Tiền Mặt
                </button>
                <button 
                    onClick={handlePayOnline}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition flex items-center shadow-lg shadow-blue-200"
                >
                    <CreditCard size={20} className="mr-2" />
                    Thanh toán VNPay
                </button>
            </div>
        )}

      </div>
    </div>
  );
}
