import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2, Search, Save, X } from 'lucide-react';
import api from '../../api/axiosConfig';
import { useTablePagination } from '../../hooks/useTablePagination';
import Pagination from '../../components/common/Pagination';

export default function ServiceCatalogManagement() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentService, setCurrentService] = useState({ name: '', defaultCost: 0, description: '' });
    const [isEditing, setIsEditing] = useState(false);

    const {
        currentData: currentServices,
        currentPage,
        totalPages,
        searchTerm,
        setSearchTerm,
        handlePageChange,
        totalItems
    } = useTablePagination(services, (s, term) => 
        s.name.toLowerCase().includes(term)
    );

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await api.get('/repair/service-catalog');
            setServices(response.data.content || response.data || []);
        } catch (error) {
            console.error('Lỗi lấy danh mục dịch vụ:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleOpenModal = (service = null) => {
        if (service) {
            setCurrentService(service);
            setIsEditing(true);
        } else {
            setCurrentService({ name: '', defaultCost: 0, description: '' });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/repair/service-catalog/${currentService.id}`, currentService);
            } else {
                await api.post('/repair/service-catalog', currentService);
            }
            fetchServices();
            setIsModalOpen(false);
        } catch (error) {
            alert('Lỗi khi lưu dịch vụ!');
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) return;
        try {
            await api.delete(`/repair/service-catalog/${id}`);
            fetchServices();
        } catch (error) {
            alert('Lỗi khi xóa!');
            console.error(error);
        }
    };


    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Danh mục Dịch vụ</h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý các công việc và bảng giá công thợ</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                >
                    <Plus size={18} />
                    <span>Thêm Dịch vụ</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div className="relative w-96">
                        <input
                            type="text"
                            placeholder="Tìm kiếm dịch vụ..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tên Dịch vụ</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mô tả</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Giá niêm yết (VNĐ)</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-8">Đang tải...</td></tr>
                            ) : currentServices.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-8 text-slate-500">Không có dữ liệu</td></tr>
                            ) : (
                                currentServices.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-800">{s.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{s.description || '-'}</td>
                                        <td className="px-6 py-4 font-bold text-blue-600 text-right">{s.defaultCost?.toLocaleString('vi-VN')}</td>
                                        <td className="px-6 py-4 text-center space-x-3">
                                            <button onClick={() => handleOpenModal(s)} className="text-blue-500 hover:text-blue-700">
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700">
                                                <Trash2 size={18} />
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
                    onPageChange={handlePageChange} 
                />
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">{isEditing ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-1 rounded-full"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tên dịch vụ</label>
                                <input type="text" required value={currentService.name} onChange={e => setCurrentService({...currentService, name: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Giá tiền công (VNĐ)</label>
                                <input type="number" required min="0" value={currentService.defaultCost} onChange={e => setCurrentService({...currentService, defaultCost: Number(e.target.value)})}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Mô tả (Tùy chọn)</label>
                                <textarea rows="3" value={currentService.description} onChange={e => setCurrentService({...currentService, description: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center"><Save size={18} className="mr-2"/> Lưu lại</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
