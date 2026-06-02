import React, { useState } from 'react';
import axios from 'axios';

const ProfileUpdateModal = ({ profile, onUpdateComplete }) => {
    // Thông tin cá nhân
    const [fullName, setFullName] = useState(profile?.fullName || '');
    const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber === 'N/A' ? '' : (profile?.phoneNumber || ''));
    const [email, setEmail] = useState(profile?.email || '');
    const [address, setAddress] = useState(profile?.address || '');

    // Thông tin xe
    const [licensePlate, setLicensePlate] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!phoneNumber || phoneNumber.length < 10) {
            setError('Vui lòng nhập số điện thoại hợp lệ (10-11 số).');
            return;
        }

        if (!licensePlate || !brand) {
            setError('Vui lòng nhập Biển số xe và Hãng xe.');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // 1. Cập nhật thông tin cá nhân
            await axios.put(`http://localhost:8080/api/customers/${profile.id}`, {
                fullName: fullName,
                phoneNumber: phoneNumber,
                email: email,
                address: address
            }, { headers });

            // 2. Thêm thông tin xe
            await axios.post('http://localhost:8080/api/customers/vehicles', {
                licensePlate: licensePlate,
                brand: brand,
                model: model,
                year: year ? parseInt(year) : null,
                customerId: profile.id
            }, { headers });

            // Gọi hàm callback báo hiệu hoàn tất để ẩn Modal và refresh dữ liệu
            onUpdateComplete();

        } catch (err) {
            console.error("Lỗi cập nhật:", err);
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật dữ liệu. Có thể số điện thoại hoặc biển số xe đã tồn tại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="bg-blue-600 text-white p-6 rounded-t-xl">
                    <h2 className="text-2xl font-bold">Chào mừng bạn đến với GaraOto!</h2>
                    <p className="mt-2 text-blue-100 text-sm">
                        Để tiếp tục sử dụng các dịch vụ đặt lịch và theo dõi sửa xe, vui lòng cập nhật thông tin liên lạc và đăng ký ít nhất một chiếc xe của bạn.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    {/* Section 1: Thông tin cá nhân */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">1. Thông tin liên hệ</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                                    className="w-full border rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                                <input type="text" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="Ví dụ: 0912345678"
                                    className="w-full border rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                                    className="w-full border rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Thông tin Xe */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">2. Thông tin Xe của bạn</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Biển số xe *</label>
                                <input type="text" required value={licensePlate} onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                                    placeholder="Ví dụ: 30A-12345"
                                    className="w-full border rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500 uppercase" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hãng xe *</label>
                                <input type="text" required value={brand} onChange={(e) => setBrand(e.target.value)}
                                    placeholder="Ví dụ: Toyota, VinFast"
                                    className="w-full border rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dòng xe (Model)</label>
                                <input type="text" value={model} onChange={(e) => setModel(e.target.value)}
                                    placeholder="Ví dụ: Vios, Fadil"
                                    className="w-full border rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Năm sản xuất</label>
                                <input type="number" value={year} onChange={(e) => setYear(e.target.value)}
                                    placeholder="Ví dụ: 2022"
                                    className="w-full border rounded-md px-4 py-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full py-3 rounded-lg text-white font-bold text-lg transition-colors
                                ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {loading ? 'Đang cập nhật...' : 'Hoàn tất cập nhật'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileUpdateModal;
