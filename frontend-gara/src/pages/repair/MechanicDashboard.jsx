import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle, Clock, AlertTriangle, FileText, Settings } from 'lucide-react';
import axios from 'axios';
import MechanicOrderDetailsModal from './MechanicOrderDetailsModal';

const MechanicDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customersMap, setCustomersMap] = useState({});

    // Để tạm, do chúng ta chưa gán chính xác mechanicId, tạm thời lấy tất cả xe đang sửa
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const res = await axios.get('http://localhost:8080/api/repair/orders', { headers });
            
            // Chỉ lấy các phiếu đang ở trạng thái REPAIRING
            const activeOrders = res.data.filter(o => o.status === 'REPAIRING');
            setOrders(activeOrders);

            // Fetch thông tin khách hàng
            const customerIds = [...new Set(activeOrders.map(a => a.customerId))];
            if (customerIds.length > 0) {
                const customersRes = await axios.get('http://localhost:8080/api/customers', { headers });
                const map = {};
                customersRes.data.forEach(c => {
                    map[c.id] = c;
                });
                setCustomersMap(map);
            }
        } catch (error) {
            console.error("Lỗi lấy danh sách xe đang sửa:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const openDetails = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const handleSaveSuccess = () => {
        setIsModalOpen(false);
        fetchOrders(); // Tải lại danh sách
    };

    // Hàm đếm số hạng mục đã hoàn thành
    const getProgress = (tasks) => {
        if (!tasks || tasks.length === 0) return { done: 0, total: 0, percent: 0 };
        const total = tasks.length;
        const done = tasks.filter(t => t.status === 'DONE').length;
        const percent = Math.round((done / total) * 100);
        return { done, total, percent };
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Đang tải công việc...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Wrench className="w-6 h-6 mr-2 text-purple-600" />
                        Trạm Sửa Chữa (Dành cho Thợ)
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý và cập nhật tiến độ các xe đang thi công</p>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-700">Tuyệt vời!</h3>
                    <p className="text-slate-500 mt-1">Không có xe nào đang chờ sửa. Chúc bạn nghỉ ngơi vui vẻ!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map((order) => {
                        const customer = customersMap[order.customerId] || {};
                        const progress = getProgress(order.tasks);
                        
                        return (
                            <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded">
                                            {order.orderNumber}
                                        </span>
                                        <h3 className="font-bold text-lg text-slate-800 mt-2">{customer.fullName || 'Khách vãng lai'}</h3>
                                    </div>
                                    <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                                        <Settings className="w-5 h-5" />
                                    </div>
                                </div>
                                
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-500 font-medium">Tiến độ công việc</span>
                                        <span className="font-bold text-slate-700">{progress.percent}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                                        <div 
                                            className={`h-2.5 rounded-full ${progress.percent === 100 ? 'bg-green-500' : 'bg-purple-600'}`} 
                                            style={{ width: `${progress.percent}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Hoàn thành {progress.done}/{progress.total} hạng mục</p>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex justify-end">
                                    <button 
                                        onClick={() => openDetails(order)}
                                        className="text-purple-600 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center"
                                    >
                                        <FileText className="w-4 h-4 mr-1" />
                                        Cập nhật tiến độ
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isModalOpen && selectedOrder && (
                <MechanicOrderDetailsModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    order={selectedOrder}
                    onSaveSuccess={handleSaveSuccess}
                />
            )}
        </div>
    );
};

export default MechanicDashboard;
