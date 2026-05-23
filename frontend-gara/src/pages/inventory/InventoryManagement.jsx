import { useState, useEffect } from 'react';
import { Package, Plus, ArrowUpRight, ArrowDownRight, X, AlertCircle } from 'lucide-react';
import api from '../../api/axiosConfig';

export default function InventoryManagement() {
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(true);

    // State cho Modal Thêm Phụ tùng
    const [isPartModalOpen, setIsPartModalOpen] = useState(false);
    const [partForm, setPartForm] = useState({ partCode: '', name: '', description: '', price: '', stockQuantity: '' });

    // State cho Modal Cập nhật Kho (Nhập/Xuất)
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [selectedPart, setSelectedPart] = useState(null);
    const [stockChange, setStockChange] = useState('');
    const [stockAction, setStockAction] = useState('add'); // 'add' (Nhập) hoặc 'remove' (Xuất)

    const [error, setError] = useState('');

    // Tải danh sách phụ tùng
    const fetchParts = async () => {
        try {
            const response = await api.get('/inventory/parts');
            setParts(response.data);
        } catch (error) {
            console.error("Lỗi khi tải kho phụ tùng:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParts();
    }, []);

    // Xử lý tạo Phụ tùng mới
    const handlePartSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/inventory/parts', {
                ...partForm,
                price: parseFloat(partForm.price),
                stockQuantity: parseInt(partForm.stockQuantity)
            });
            setIsPartModalOpen(false);
            setPartForm({ partCode: '', name: '', description: '', price: '', stockQuantity: '' });
            fetchParts();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi thêm phụ tùng mới.');
        }
    };

    // Xử lý Cập nhật tồn kho (Cộng/Trừ)
    const handleStockSubmit = async (e) => {
        e.preventDefault();
        setError('');
        let changeValue = parseInt(stockChange);
        if (stockAction === 'remove') {
            changeValue = -Math.abs(changeValue); // Đảm bảo là số âm khi xuất kho
        }

        try {
            await api.patch(`/inventory/parts/${selectedPart.id}/stock?quantityChange=${changeValue}`);
            setIsStockModalOpen(false);
            setStockChange('');
            fetchParts();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi cập nhật số lượng tồn kho.');
        }
    };

    // Format tiền tệ VNĐ
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Đang đồng bộ dữ liệu kho...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Package className="w-6 h-6 text-emerald-600" />
                        Kho Phụ tùng & Vật tư
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Quản lý danh mục linh kiện và số lượng tồn kho</p>
                </div>
                <button
                    onClick={() => setIsPartModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Thêm mã vật tư
                </button>
            </div>

            {/* Bảng dữ liệu Kho */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">MÃ VẬT TƯ</th>
                            <th className="px-6 py-4">TÊN PHỤ TÙNG</th>
                            <th className="px-6 py-4 text-right">ĐƠN GIÁ</th>
                            <th className="px-6 py-4 text-center">TỒN KHO</th>
                            <th className="px-6 py-4 text-center">THAO TÁC NHANH</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {parts.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    <AlertCircle className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                                    Chưa có vật tư nào trong danh mục.
                                </td>
                            </tr>
                        ) : (
                            parts.map((part) => (
                                <tr key={part.id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-gray-900">{part.partCode}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-800">{part.name}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{part.description}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-emerald-600">
                                        {formatCurrency(part.price)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold ${part.stockQuantity > 10 ? 'bg-emerald-100 text-emerald-800' : part.stockQuantity > 0 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                        {part.stockQuantity}
                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-center flex justify-center gap-2">
                                        <button
                                            onClick={() => { setSelectedPart(part); setStockAction('add'); setIsStockModalOpen(true); }}
                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Nhập hàng"
                                        >
                                            <ArrowUpRight className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => { setSelectedPart(part); setStockAction('remove'); setIsStockModalOpen(true); }}
                                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Xuất kho"
                                        >
                                            <ArrowDownRight className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL 1: THÊM MÃ VẬT TƯ MỚI */}
            {isPartModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">Thêm Mã Vật Tư</h3>
                            <button onClick={() => setIsPartModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handlePartSubmit} className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Mã phụ tùng (SKU) *</label>
                                <input required placeholder="VD: OIL-CAS-10W40" type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 uppercase" value={partForm.partCode} onChange={e => setPartForm({...partForm, partCode: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên vật tư *</label>
                                <input required placeholder="VD: Nhớt Castrol Power1" type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500" value={partForm.name} onChange={e => setPartForm({...partForm, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả chi tiết</label>
                                <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500" value={partForm.description} onChange={e => setPartForm({...partForm, description: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Đơn giá bán (VNĐ) *</label>
                                    <input required min="0" type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500" value={partForm.price} onChange={e => setPartForm({...partForm, price: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tồn kho ban đầu *</label>
                                    <input required min="0" type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500" value={partForm.stockQuantity} onChange={e => setPartForm({...partForm, stockQuantity: e.target.value})} />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3 border-t border-gray-50">
                                <button type="button" onClick={() => setIsPartModalOpen(false)} className="flex-1 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors">Hủy</button>
                                <button type="submit" className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm">Lưu vật tư</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: CẬP NHẬT TỒN KHO (NHẬP/XUẤT) */}
            {isStockModalOpen && selectedPart && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className={`flex items-center justify-between p-6 border-b border-gray-100 ${stockAction === 'add' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                            <h3 className={`text-lg font-bold ${stockAction === 'add' ? 'text-emerald-800' : 'text-rose-800'}`}>
                                {stockAction === 'add' ? 'Phiếu Nhập Kho' : 'Phiếu Xuất Kho'}
                            </h3>
                            <button onClick={() => setIsStockModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-white/50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleStockSubmit} className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                                <div className="text-gray-500 mb-1">Mã: <span className="font-semibold text-gray-700">{selectedPart.partCode}</span></div>
                                <div className="font-semibold text-gray-900 truncate">{selectedPart.name}</div>
                                <div className="mt-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    Tồn kho hiện tại: <span className="text-blue-600 font-bold text-base ml-1">{selectedPart.stockQuantity}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Số lượng {stockAction === 'add' ? 'nhập thêm' : 'xuất đi'} *
                                </label>
                                <input
                                    required
                                    min="1"
                                    max={stockAction === 'remove' ? selectedPart.stockQuantity : undefined}
                                    type="number"
                                    className={`w-full px-4 py-3 text-lg font-bold border-2 rounded-lg focus:outline-none ${stockAction === 'add' ? 'border-gray-200 focus:border-emerald-500 text-emerald-700' : 'border-gray-200 focus:border-rose-500 text-rose-700'}`}
                                    value={stockChange}
                                    onChange={e => setStockChange(e.target.value)}
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="submit" className={`w-full py-3 text-white font-bold rounded-lg transition-colors shadow-sm ${stockAction === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                                    {stockAction === 'add' ? 'Xác nhận Nhập' : 'Xác nhận Xuất'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}