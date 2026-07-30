import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../api/axiosConfig';

const CustomerBilling = () => {
    const [invoices, setInvoices] = useState([]);
    const customerId = localStorage.getItem('customerId');
    const navigate = useNavigate();

    useEffect(() => {
        if (!customerId) return;
        const fetchInvoices = async () => {
            try {
                const res = await api.get(`/billing/invoices/customer/${customerId}`);
                const dataList = res.data.content || res.data || [];
                setInvoices(dataList);
            } catch (error) {
                console.error("Lỗi lấy danh sách hóa đơn:", error);
            }
        };
        fetchInvoices();
    }, [customerId]);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <button 
                onClick={() => navigate(-1)} 
                className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 font-medium transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 w-fit"
            >
                <ArrowLeft size={18} />
                <span>Quay lại</span>
            </button>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-3 mb-8 pb-4 border-b border-slate-100">
                    <div className="bg-orange-100 p-2 rounded-lg">
                        <FileText className="text-orange-600" size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Quản lý hóa đơn</h2>
                </div>

                {invoices.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-500 text-lg">Bạn chưa có hóa đơn nào trong hệ thống.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {invoices.map(invoice => (
                            <div key={invoice.id} className="border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center bg-white group">
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <h3 className="text-lg font-bold text-slate-800">Mã hóa đơn: {invoice.invoiceNumber}</h3>
                                        <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${
                                            invoice.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {invoice.status === 'PAID' ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
                                            <span>{invoice.status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-sm mb-3">Mã phiếu sửa chữa: <span className="font-medium text-slate-700">{invoice.repairOrderNumber}</span></p>
                                    <p className="text-2xl font-black text-orange-600">
                                        {invoice.totalAmount?.toLocaleString('vi-VN')} <span className="text-base text-orange-500 font-bold">VNĐ</span>
                                    </p>
                                </div>
                                <div className="mt-4 md:mt-0 flex flex-col space-y-2 w-full md:w-auto">
                                    <button className="text-orange-600 hover:text-white border border-orange-600 hover:bg-orange-600 font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors w-full md:w-auto text-center">
                                        Xem chi tiết
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerBilling;
