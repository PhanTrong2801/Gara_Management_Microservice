import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle, Clock, Check, XCircle } from 'lucide-react';
import api from '../../api/axiosConfig';

const BookingAppointment = () => {
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const navigate = useNavigate();
    const customerId = localStorage.getItem('customerId');

    const fetchAppointments = async () => {
        if (!customerId) return;
        try {
            const res = await api.get(`/repair/appointments/customer/${customerId}`);
            const dataList = res.data.content || res.data || [];
            // Sắp xếp lịch hẹn mới nhất lên đầu
            const sortedAppointments = dataList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAppointments(sortedAppointments);
        } catch (error) {
            console.error("Lỗi lấy danh sách lịch hẹn:", error);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [customerId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!customerId) return alert("Không tìm thấy thông tin khách hàng, vui lòng tải lại trang.");

        if (description.trim().length < 10) {
            alert("Vui lòng nhập mô tả chi tiết hơn (ít nhất 10 ký tự).");
            return;
        }

        setLoading(true);
        try {
            await api.post('/repair/appointments', {
                customerId: Number(customerId),
                appointmentDate: date + "T00:00:00",
                description: description
            });
            setSuccessMsg("Đặt lịch thành công! Chúng tôi sẽ liên hệ lại với bạn sớm nhất.");
            setDate('');
            setDescription('');
            fetchAppointments(); // Refresh list after successful booking
            
            // Ẩn thông báo sau 5 giây
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            console.error("Lỗi đặt lịch:", error);
            alert("Có lỗi xảy ra khi đặt lịch.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'PENDING': return { text: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={16} /> };
            case 'CONFIRMED': return { text: 'Đã xác nhận', color: 'bg-green-100 text-green-700', icon: <Check size={16} /> };
            case 'CANCELLED': return { text: 'Đã hủy', color: 'bg-red-100 text-red-700', icon: <XCircle size={16} /> };
            default: return { text: status, color: 'bg-slate-100 text-slate-700', icon: <Clock size={16} /> };
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button 
                onClick={() => navigate(-1)} 
                className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 font-medium transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 w-fit"
            >
                <ArrowLeft size={18} />
                <span>Quay lại</span>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cột trái: Form đặt lịch */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 h-fit">
                    <div className="flex items-center space-x-3 mb-8 pb-4 border-b border-slate-100">
                        <div className="bg-green-100 p-2 rounded-lg">
                            <Calendar className="text-green-600" size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Đặt lịch mới</h2>
                    </div>

                    {successMsg && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-8 border border-green-200 flex items-center space-x-3 transition-opacity">
                            <CheckCircle size={20} />
                            <span className="font-medium">{successMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Ngày hẹn mong muốn</label>
                            <input 
                                type="date" 
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]} // Không cho chọn ngày quá khứ
                                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Mô tả tình trạng xe / Yêu cầu đặc biệt</label>
                            <textarea 
                                required
                                rows="4"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ví dụ: Xe bị xước cản trước, cần thay nhớt..."
                                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm resize-none"
                            ></textarea>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className={`w-full font-bold py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2
                                    ${loading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'}`}
                            >
                                {loading ? <span>Đang xử lý...</span> : <span>Gửi yêu cầu đặt lịch</span>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Cột phải: Lịch sử lịch hẹn */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
                        <h2 className="text-xl font-bold text-slate-800">Lịch sử đặt hẹn của bạn</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[500px]">
                        {appointments.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 h-full flex flex-col justify-center items-center">
                                <Calendar className="text-slate-300 mb-3" size={40} />
                                <p className="text-slate-500">Bạn chưa có lịch hẹn nào.</p>
                            </div>
                        ) : (
                            appointments.map(appt => {
                                const statusInfo = getStatusInfo(appt.status);
                                return (
                                    <div key={appt.id} className="p-4 rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all bg-slate-50">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="font-bold text-slate-800 text-lg">
                                                {new Date(appt.appointmentDate).toLocaleDateString('vi-VN')}
                                            </span>
                                            <span className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
                                                {statusInfo.icon}
                                                <span>{statusInfo.text}</span>
                                            </span>
                                        </div>
                                        <p className="text-slate-600 text-sm bg-white p-3 rounded-lg border border-slate-100">
                                            {appt.description}
                                        </p>
                                        <div className="mt-3 text-xs text-slate-400 text-right">
                                            Tạo ngày: {new Date(appt.createdAt).toLocaleString('vi-VN')}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingAppointment;
