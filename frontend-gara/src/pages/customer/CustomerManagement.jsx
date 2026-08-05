import { useState, useEffect } from 'react';
import { Users, Plus, Car, Phone, MapPin, Mail, X, CheckCircle, Search } from 'lucide-react';
import api from '../../api/axiosConfig';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';

export default function CustomerManagement() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    // State quản lý ẩn hiện Modal
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);


    // State quản lý dữ liệu Form
    const [customerForm, setCustomerForm] = useState({ fullName: '', phoneNumber: '', email: '', address: '' });
    const [vehicleForm, setVehicleForm] = useState({ licensePlate: '', vin: '', brand: '', model: '', year: new Date().getFullYear() });
    const [error, setError] = useState('');

    // Server-side pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const debouncedSearch = useDebounce(searchTerm, 500);

    // Hàm tải danh sách khách hàng
    const fetchCustomers = async () => {
        try {
            const response = await api.get(`/customers?page=${currentPage - 1}&size=9&search=${debouncedSearch}`);
            setCustomers(response.data.content || []);
            setTotalPages(response.data.totalPages || 1);
            setTotalItems(response.data.totalElements || 0);
        } catch (error) {
            console.error("Lỗi khi tải danh sách khách hàng:", error);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [currentPage, debouncedSearch]);

    //Xử lý sự kiện click vào nút sửa
    const handleEditClick = (customer) =>{
        setEditingCustomer({
            id: customer.id,
            fullName: customer.fullName || '',
            phoneNumber: customer.phoneNumber || '',
            email: customer.email || '',
            address: customer.address || ''
        });
        setError('');
        setIsEditModalOpen(true);
    }

    // Xử lý tạo Khách hàng
    const handleCustomerSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/customers', customerForm);
            setIsCustomerModalOpen(false); // Đóng modal
            setCustomerForm({ fullName: '', phoneNumber: '', email: '', address: '' }); // Reset form
            fetchCustomers(); // Tải lại danh sách mới
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi thêm khách hàng.');
        }
    };

    //Xử lý sự kiện cập nhật 
    const handleEditSubmit = async (e) =>{
        e.preventDefault();
        setError('');
        try{
            await api.put(`/customers/${editingCustomer.id}`,{
                fullName: editingCustomer.fullName,
                phoneNumber: editingCustomer.phoneNumber,
                email: editingCustomer.email,
                address: editingCustomer.address
            });

            setIsEditModalOpen(false);
            setEditingCustomer(null);
            fetchCustomers();
        }catch(err){
            setError(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật thông tin.");
        }
    }

    // Xử lý thêm Xe cho khách hàng
    const handleVehicleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/customers/vehicles', { ...vehicleForm, customerId: selectedCustomerId });
            setIsVehicleModalOpen(false);
            setVehicleForm({ licensePlate: '', vin: '', brand: '', model: '', year: new Date().getFullYear() });
            fetchCustomers();
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi thêm phương tiện.');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Đang tải hồ sơ khách hàng...</div>;

    const getTierBadge = (tier) => {
        switch(tier) {
            case 'PLATINUM': return <span className="px-2 py-0.5 bg-slate-800 text-slate-100 text-xs font-bold rounded-full ml-2 border border-slate-700 shadow-sm">BẠCH KIM</span>;
            case 'GOLD': return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full ml-2 border border-yellow-200">VÀNG</span>;
            case 'SILVER': return <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-bold rounded-full ml-2 border border-gray-300">BẠC</span>;
            case 'BRONZE':
            default: return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full ml-2 border border-orange-200">ĐỒNG</span>;
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-600" />
                        Quản lý Khách hàng & Xe
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Danh sách hồ sơ khách hàng và phương tiện đã đăng ký</p>
                </div>
                
                <div className="flex-1 max-w-md mx-6">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm theo tên hoặc SĐT..." 
                            value={searchTerm}
                            onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-sm"
                        />
                    </div>
                </div>

                <button
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Thêm Khách hàng
                </button>
            </div>

            {/* Danh sách dạng thẻ (Card Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {customers.length === 0 ? (
                    <div className="col-span-full p-12 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
                        <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">Chưa có khách hàng nào trong hệ thống.</p>
                    </div>
                ) : (
                    customers.map((customer) => (
                        <div key={customer.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between">
                            <div>
                                {/* Thông tin Khách hàng */}
                                <div className="border-b border-gray-100 pb-4 mb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                            {customer.fullName}
                                            {customer.loyalty && getTierBadge(customer.loyalty.tier)}
                                        </h3>
                                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                      ID: {customer.id}
                    </span>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            {customer.phoneNumber}
                                        </div>
                                        {customer.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                {customer.email}
                                            </div>
                                        )}
                                        {customer.address && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span className="truncate">{customer.address}</span>
                                            </div>
                                        )}
                                        {customer.loyalty && (
                                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50">
                                                <span className="text-xs font-medium bg-purple-50 text-purple-600 px-2 py-1 rounded">
                                                  Tổng điểm: {customer.loyalty.totalPoints || 0}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                  (Đã chi: {customer.loyalty.totalSpent?.toLocaleString() || 0}đ)
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Thông tin Xe */}
                                <div className="mb-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                                        <Car className="w-3.5 h-3.5" />
                                        Phương tiện sở hữu ({customer.vehicles?.length || 0})
                                    </h4>

                                    {customer.vehicles && customer.vehicles.length > 0 ? (
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {customer.vehicles.map((vehicle) => (
                                                <div key={vehicle.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                                                    <div>
                                                        <p className="font-semibold text-slate-800 text-sm">{vehicle.licensePlate}</p>
                                                        <p className="text-xs text-slate-500">{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">Chưa đăng ký xe nào.</p>
                                    )}
                                </div>
                            </div>

                            {/* Nút thao tác nhanh */}
                            <div className="pt-4 border-t border-gray-50 flex gap-2">
                                <button
                                    onClick={()=>handleEditClick(customer)} 
                                    className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                                    Sửa hồ sơ
                                </button>
                                <button
                                    onClick={() => { setSelectedCustomerId(customer.id); setIsVehicleModalOpen(true); }}
                                    className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-colors"
                                >
                                    + Thêm xe
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 flex justify-center">
                <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    totalItems={totalItems} 
                    onPageChange={setCurrentPage} 
                />
            </div>

            {/* MODAL 1: THÊM KHÁCH HÀNG */}
            {isCustomerModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">Đăng ký khách hàng mới</h3>
                            <button onClick={() => setIsCustomerModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCustomerSubmit} className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và tên *</label>
                                <input required type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" value={customerForm.fullName} onChange={e => setCustomerForm({...customerForm, fullName: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại *</label>
                                <input required type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" value={customerForm.phoneNumber} onChange={e => setCustomerForm({...customerForm, phoneNumber: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                <input type="email" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Địa chỉ</label>
                                <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" value={customerForm.address} onChange={e => setCustomerForm({...customerForm, address: e.target.value})} />
                            </div>
                            <div className="pt-4 flex gap-3 border-t border-gray-50">
                                <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="flex-1 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors">Hủy</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm">Lưu lại</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: THÊM XE CHO KHÁCH HÀNG */}
            {isVehicleModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">Đăng ký xe mới (Chủ xe ID: {selectedCustomerId})</h3>
                            <button onClick={() => setIsVehicleModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleVehicleSubmit} className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Biển số xe *</label>
                                    <input required placeholder="Ví dụ: 51G-999.99" type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" value={vehicleForm.licensePlate} onChange={e => setVehicleForm({...vehicleForm, licensePlate: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Hãng xe</label>
                                    <input placeholder="Ví dụ: Toyota" type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" value={vehicleForm.brand} onChange={e => setVehicleForm({...vehicleForm, brand: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Dòng xe (Model)</label>
                                    <input placeholder="Ví dụ: Camry" type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" value={vehicleForm.model} onChange={e => setVehicleForm({...vehicleForm, model: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Năm sản xuất</label>
                                    <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" value={vehicleForm.year} onChange={e => setVehicleForm({...vehicleForm, year: parseInt(e.target.value) || ''})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Số khung (VIN)</label>
                                    <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" value={vehicleForm.vin} onChange={e => setVehicleForm({...vehicleForm, vin: e.target.value})} />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3 border-t border-gray-50">
                                <button type="button" onClick={() => setIsVehicleModalOpen(false)} className="flex-1 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors">Hủy</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm">Thêm xe</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


             {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">Sửa thông tin khách</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và tên *</label>
                                <input required type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" value={editingCustomer.fullName} onChange={e => setEditingCustomer({...editingCustomer, fullName: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại *</label>
                                <input required type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" value={editingCustomer.phoneNumber} onChange={e => setEditingCustomer({...editingCustomer, phoneNumber: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                <input type="email" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" value={editingCustomer.email} onChange={e => setEditingCustomer({...editingCustomer, email: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Địa chỉ</label>
                                <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" value={editingCustomer.address} onChange={e => setEditingCustomer({...editingCustomer, address: e.target.value})} />
                            </div>
                            <div className="pt-4 flex gap-3 border-t border-gray-50">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors">Hủy</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm">Lưu lại</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}