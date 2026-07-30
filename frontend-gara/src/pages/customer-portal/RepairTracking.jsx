import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wrench } from 'lucide-react';
import api from '../../api/axiosConfig';
import CustomerRepairOrderDetailsModal from './CustomerRepairOrderDetailsModal';

const RepairTracking = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const customerId = localStorage.getItem('customerId');
    const navigate = useNavigate();

    useEffect(() => {
        if (!customerId) return;
        const fetchOrders = async () => {
            try {
                const res = await api.get(`/repair/orders/customer/${customerId}`);
                const dataList = res.data.content || res.data || [];
                setOrders(dataList);
            } catch (error) {
                console.error("Lỗi lấy danh sách sửa chữa:", error);
            }
        };
        fetchOrders();
    }, [customerId]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'IN_PROGRESS': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'COMPLETED': return 'bg-green-50 text-green-700 border-green-200';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'PENDING': return 'Chờ chẩn đoán';
            case 'IN_PROGRESS': return 'Đang sửa chữa';
            case 'COMPLETED': return 'Đã hoàn thành';
            default: return status;
        }
    };

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 relative">
            <button 
                onClick={() => navigate(-1)} 
                className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 font-medium transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 w-fit"
            >
                <ArrowLeft size={18} />
                <span>Quay lại</span>
            </button>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-3 mb-8 pb-4 border-b border-slate-100">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <Wrench className="text-blue-600" size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Tiến độ sửa xe</h2>
                </div>
                
                {orders.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <Wrench className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-500 text-lg">Bạn chưa có phiếu sửa chữa nào trong hệ thống.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div key={order.id} className="border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center bg-white">
                                <div>
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-lg font-bold text-slate-800">Mã phiếu: {order.orderNumber}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-sm flex items-center space-x-1">
                                        <span>Ngày tiếp nhận: {new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                                    </p>
                                </div>
                                <div className="mt-4 md:mt-0">
                                    <button 
                                        onClick={() => handleViewDetails(order)}
                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm bg-blue-50 px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Xem chi tiết
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CustomerRepairOrderDetailsModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                order={selectedOrder} 
            />
        </div>
    );
};

export default RepairTracking;
