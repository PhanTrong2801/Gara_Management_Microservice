import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, XCircle } from 'lucide-react';
import api from '../../api/axiosConfig.js';

export default function CreateRepairOrder() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // State lưu trữ dữ liệu form
    const [formData, setFormData] = useState({
        customerId: '',
        carId: '',
        odo: '',
        fuelLevel: '50%',
        scratches: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Đóng gói data theo đúng định dạng DTO của Backend
            const payload = {
                customerId: parseInt(formData.customerId),
                carId: parseInt(formData.carId),
                checkInInfo: {
                    odo: parseInt(formData.odo),
                    fuelLevel: formData.fuelLevel,
                    scratches: formData.scratches
                }
            };

            await api.post('/repair/orders', payload);
            alert('Tạo phiếu tiếp nhận thành công!');
            navigate('/dashboard'); // Quay lại trang chủ
        } catch (error) {
            alert('Lỗi khi tạo phiếu! Vui lòng kiểm tra lại hệ thống.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Tạo Phiếu Tiếp Nhận Mới</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    {/* Thông tin chủ xe & Xe (Tạm nhập tay ID, sau này có thể làm Dropdown chọn từ DB) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mã Khách Hàng (ID)</label>
                        <input type="number" name="customerId" required value={formData.customerId} onChange={handleChange}
                               className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: 10" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mã Xe (ID)</label>
                        <input type="number" name="carId" required value={formData.carId} onChange={handleChange}
                               className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: 1" />
                    </div>

                    {/* Thông tin lúc tiếp nhận */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Số Km hiện tại (ODO)</label>
                        <input type="number" name="odo" required value={formData.odo} onChange={handleChange}
                               className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="VD: 45000" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mức nhiên liệu</label>
                        <select name="fuelLevel" value={formData.fuelLevel} onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="25%">25% (Sắp hết)</option>
                            <option value="50%">50% (Nửa bình)</option>
                            <option value="75%">75% (Gần đầy)</option>
                            <option value="100%">100% (Đầy bình)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tình trạng vỏ xe (Ghi chú vết xước, móp...)</label>
                    <textarea name="scratches" rows="3" value={formData.scratches} onChange={handleChange}
                              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="VD: Xước nhẹ cản trước bên phụ..."></textarea>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                    <button type="button" onClick={() => navigate('/dashboard')}
                            className="flex items-center px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                        <XCircle className="w-5 h-5 mr-2"/> Hủy
                    </button>
                    <button type="submit" disabled={loading}
                            className="flex items-center px-6 py-2 text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition disabled:opacity-50">
                        <Save className="w-5 h-5 mr-2"/> {loading ? 'Đang lưu...' : 'Lưu Phiếu'}
                    </button>
                </div>
            </form>
        </div>
    );
}