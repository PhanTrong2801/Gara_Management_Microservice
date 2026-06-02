import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, XCircle, Search, ChevronDown } from 'lucide-react';
import api from '../../api/axiosConfig.js';

export default function CreateRepairOrder() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Trạng thái cho Custom Combobox
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // State lưu trữ dữ liệu form
    const [formData, setFormData] = useState({
        customerId: '',
        carId: '',
        odo: '',
        fuelLevel: '50%',
        scratches: location.state?.prefillDescription || '' // Nhận dữ liệu từ Lịch hẹn (nếu có)
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Lấy danh sách khách hàng khi component mount
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await api.get('/customers');
                setCustomers(response.data);
                
                // Tự động tìm và chọn khách hàng nếu có truyền SĐT từ Lịch hẹn
                if (location.state?.prefillCustomerPhone && response.data.length > 0) {
                    const phone = location.state.prefillCustomerPhone;
                    const customerMatch = response.data.find(c => c.phoneNumber === phone);
                    if (customerMatch) {
                        setSelectedCustomer(customerMatch);
                        setFormData(prev => ({ ...prev, customerId: customerMatch.id }));
                        setSearchQuery(customerMatch.fullName);
                    }
                }
            } catch (error) {
                console.error("Lỗi tải khách hàng:", error);
            }
        };
        fetchCustomers();
    }, [location.state]);

    const handleCustomerChange = (custId) => {
        setFormData({ ...formData, customerId: custId, carId: '' }); // Reset car khi đổi khách
        const cust = customers.find(c => c.id.toString() === custId.toString());
        setSelectedCustomer(cust || null);
        setSearchQuery(''); // Xóa thanh tìm kiếm khi đã chọn
        setIsDropdownOpen(false);
    };

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCustomers = customers.filter(c => 
        c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.phoneNumber.includes(searchQuery)
    );

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
                    {/* Thông tin chủ xe & Xe */}
                    <div className="relative" ref={dropdownRef}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Khách hàng (Tìm kiếm)</label>
                        <div 
                            className="relative w-full px-4 py-2 border rounded-lg focus-within:ring-2 focus-within:ring-blue-500 bg-white flex items-center justify-between cursor-text"
                            onClick={() => setIsDropdownOpen(true)}
                        >
                            <input 
                                type="text"
                                className="w-full outline-none text-sm"
                                placeholder={selectedCustomer ? `${selectedCustomer.fullName} - ${selectedCustomer.phoneNumber}` : "Nhập tên hoặc SĐT..."}
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                            />
                            <Search className="w-4 h-4 text-gray-400" />
                        </div>

                        {/* Dropdown List */}
                        {isDropdownOpen && (
                            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filteredCustomers.length === 0 ? (
                                    <li className="px-4 py-3 text-sm text-gray-500">Không tìm thấy khách hàng.</li>
                                ) : (
                                    filteredCustomers.map(c => (
                                        <li 
                                            key={c.id} 
                                            onClick={() => handleCustomerChange(c.id)}
                                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0"
                                        >
                                            <div className="font-semibold text-gray-800">{c.fullName}</div>
                                            <div className="text-xs text-gray-500">{c.phoneNumber} {c.address ? `- ${c.address}` : ''}</div>
                                        </li>
                                    ))
                                )}
                            </ul>
                        )}
                        {/* Hidden input to ensure required validation passes if form submits */}
                        <input type="hidden" name="customerId" required value={formData.customerId} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Xe (Biển số)</label>
                        <select 
                            name="carId" 
                            required 
                            value={formData.carId} 
                            onChange={handleChange}
                            disabled={!selectedCustomer}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                        >
                            <option value="">-- Chọn phương tiện --</option>
                            {selectedCustomer && selectedCustomer.vehicles && selectedCustomer.vehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.licensePlate} ({v.brand} {v.model})</option>
                            ))}
                        </select>
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