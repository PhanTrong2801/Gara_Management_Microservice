import { useState, useEffect } from 'react';
import { Package, Plus, ArrowUpRight, ArrowDownRight, X, AlertCircle, Edit, Trash2, History, Search } from 'lucide-react';
import api from '../../api/axiosConfig';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';

export default function InventoryManagement() {
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(true);

    // State cho Modal Thêm Phụ tùng
    const [isPartModalOpen, setIsPartModalOpen] = useState(false);
    const [editingPartId, setEditingPartId] = useState(null);
    const [partForm, setPartForm] = useState({ partCode: '', name: '', description: '', price: '', stockQuantity: '', minStockLevel: '5', supplierId: '' });
    
    // State Nhà cung cấp
    const [suppliers, setSuppliers] = useState([]);
    
    // State cảnh báo
    const [lowStockParts, setLowStockParts] = useState([]);

    // State cho Modal Cập nhật Kho (Nhập/Xuất)
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [selectedPart, setSelectedPart] = useState(null);
    const [stockChange, setStockChange] = useState('');
    const [stockReference, setStockReference] = useState('');
    const [stockAction, setStockAction] = useState('add'); // 'add' (Nhập) hoặc 'remove' (Xuất)

    // State cho Modal Lịch sử giao dịch
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [transactionHistory, setTransactionHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [error, setError] = useState('');

    // Server-side pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const debouncedSearch = useDebounce(searchTerm, 500);

    // Tải danh sách phụ tùng
    const fetchParts = async () => {
        try {
            const response = await api.get(`/inventory/parts?page=${currentPage - 1}&size=10&search=${debouncedSearch}`);
            setParts(response.data.content || []);
            setTotalPages(response.data.totalPages || 1);
            setTotalItems(response.data.totalElements || 0);
            
            const lowStockResponse = await api.get('/inventory/parts/low-stock?size=50');
            setLowStockParts(lowStockResponse.data.content || lowStockResponse.data || []);
        } catch (error) {
            console.error("Lỗi khi tải kho phụ tùng:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/inventory/suppliers');
            setSuppliers(res.data);
        } catch (error) {
            console.error("Lỗi khi tải nhà cung cấp:", error);
        }
    };

    useEffect(() => {
        fetchParts();
    }, [currentPage, debouncedSearch]);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    // Xử lý tạo / sửa Phụ tùng
    const handlePartSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const payload = {
                ...partForm,
                price: parseFloat(partForm.price),
                stockQuantity: parseInt(partForm.stockQuantity),
                minStockLevel: parseInt(partForm.minStockLevel),
                supplierId: partForm.supplierId ? parseInt(partForm.supplierId) : null
            };
            
            if (editingPartId) {
                await api.put(`/inventory/parts/${editingPartId}`, payload);
            } else {
                await api.post('/inventory/parts', payload);
            }
            
            setIsPartModalOpen(false);
            setPartForm({ partCode: '', name: '', description: '', price: '', stockQuantity: '', minStockLevel: '5', supplierId: '' });
            setEditingPartId(null);
            fetchParts();
        } catch (err) {
            setError(err.response?.data?.message || (editingPartId ? 'Lỗi khi cập nhật phụ tùng.' : 'Lỗi khi thêm phụ tùng mới.'));
        }
    };

    // Xử lý Xóa phụ tùng
    const handleDeletePart = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa phụ tùng này? (Không thể hoàn tác)")) return;
        try {
            await api.delete(`/inventory/parts/${id}`);
            fetchParts();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi xóa phụ tùng.');
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
            await api.patch(`/inventory/parts/${selectedPart.id}/stock?quantityChange=${changeValue}&reference=${encodeURIComponent(stockReference || 'Cập nhật thủ công')}`);
            setIsStockModalOpen(false);
            setStockChange('');
            setStockReference('');
            fetchParts();
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi cập nhật số lượng tồn kho.');
        }
    };

    const handleOpenHistory = async (part) => {
        setSelectedPart(part);
        setIsHistoryModalOpen(true);
        setHistoryLoading(true);
        try {
            const res = await api.get(`/inventory/parts/${part.id}/transactions?size=50`);
            setTransactionHistory(res.data.content || res.data || []);
        } catch (error) {
            console.error("Lỗi khi tải lịch sử:", error);
            setTransactionHistory([]);
        } finally {
            setHistoryLoading(false);
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
                <div className="flex gap-3">
                    <button
                        onClick={() => window.location.href = '/dashboard/suppliers'}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
                    >
                        Nhà cung cấp & Nhập hàng
                    </button>
                    <button
                        onClick={() => {
                            setEditingPartId(null);
                            setPartForm({ partCode: '', name: '', description: '', price: '', stockQuantity: '', minStockLevel: '5', supplierId: '' });
                            setIsPartModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm mã vật tư
                    </button>
                </div>
            </div>

            {/* Cảnh báo tồn kho */}
            {lowStockParts.length > 0 && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="text-rose-800 font-bold mb-1">Cảnh báo: Có {lowStockParts.length} vật tư sắp hết hàng!</h4>
                        <div className="text-sm text-rose-700 flex flex-wrap gap-2">
                            {lowStockParts.map(p => (
                                <span key={p.id} className="bg-white/60 px-2 py-1 rounded font-medium">
                                    {p.name} (Còn: {p.stockQuantity} - Min: {p.minStockLevel})
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Thanh Tìm kiếm */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative w-full md:w-1/3">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm mã vật tư hoặc tên..." 
                        value={searchTerm}
                        onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow text-sm"
                    />
                </div>
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
                                        {part.supplier && (
                                            <div className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded inline-block mt-1 border border-blue-100">
                                                NCC: {part.supplier.name}
                                            </div>
                                        )}
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
                                        <div className="w-px h-6 bg-gray-200 mx-1 self-center"></div>
                                        <button
                                            onClick={() => handleOpenHistory(part)}
                                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Lịch sử giao dịch"
                                        >
                                            <History className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingPartId(part.id);
                                                setPartForm({
                                                    partCode: part.partCode,
                                                    name: part.name,
                                                    description: part.description || '',
                                                    price: part.price,
                                                    stockQuantity: part.stockQuantity,
                                                    minStockLevel: part.minStockLevel,
                                                    supplierId: part.supplier ? part.supplier.id : ''
                                                });
                                                setIsPartModalOpen(true);
                                            }}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Sửa thông tin"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePart(part.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Xóa phụ tùng"
                                        >
                                            <Trash2 className="w-4 h-4" />
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
                    onPageChange={setCurrentPage} 
                />
            </div>

            {/* MODAL 1: THÊM MÃ VẬT TƯ MỚI */}
            {isPartModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">{editingPartId ? 'Cập nhật Mã Vật Tư' : 'Thêm Mã Vật Tư'}</h3>
                            <button onClick={() => setIsPartModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handlePartSubmit} className="p-6 space-y-4">
                            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Mã phụ tùng (SKU) *</label>
                                <input required disabled={!!editingPartId} placeholder="VD: OIL-CAS-10W40" type="text" className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 uppercase ${editingPartId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} value={partForm.partCode} onChange={e => setPartForm({...partForm, partCode: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên vật tư *</label>
                                <input required placeholder="VD: Nhớt Castrol Power1" type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500" value={partForm.name} onChange={e => setPartForm({...partForm, name: e.target.value})} />
                            </div>
                            <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả chi tiết</label>
                                        <input type="text" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500" value={partForm.description} onChange={e => setPartForm({...partForm, description: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nhà cung cấp *</label>
                                        <select required className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500" value={partForm.supplierId} onChange={e => setPartForm({...partForm, supplierId: e.target.value})}>
                                            <option value="">-- Chọn Nhà cung cấp --</option>
                                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                            <div className="grid grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Đơn giá (VNĐ) *</label>
                                    <input required min="0" type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500" value={partForm.price} onChange={e => setPartForm({...partForm, price: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">{editingPartId ? 'Tồn kho hiện tại' : 'Tồn kho đầu *'}</label>
                                    <input required min="0" disabled={!!editingPartId} type="number" className={`w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 ${editingPartId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} value={partForm.stockQuantity} onChange={e => setPartForm({...partForm, stockQuantity: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tồn kho Min *</label>
                                    <input required min="0" type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500" value={partForm.minStockLevel} onChange={e => setPartForm({...partForm, minStockLevel: e.target.value})} />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3 border-t border-gray-50">
                                <button type="button" onClick={() => setIsPartModalOpen(false)} className="flex-1 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors">Hủy</button>
                                <button type="submit" className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm">{editingPartId ? 'Cập nhật' : 'Lưu vật tư'}</button>
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

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Lý do / Tham chiếu
                                </label>
                                <input
                                    type="text"
                                    placeholder="VD: Kiểm kê định kỳ, Hàng hư hỏng..."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                    value={stockReference}
                                    onChange={e => setStockReference(e.target.value)}
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

            {/* MODAL 3: LỊCH SỬ GIAO DỊCH KHO */}
            {isHistoryModalOpen && selectedPart && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Thẻ Kho (Lịch sử giao dịch)</h3>
                                <div className="text-sm text-gray-500 mt-1">Phụ tùng: <span className="font-semibold text-gray-700">{selectedPart.name}</span> ({selectedPart.partCode})</div>
                            </div>
                            <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-0 overflow-y-auto max-h-[60vh]">
                            {historyLoading ? (
                                <div className="p-8 text-center text-gray-500 animate-pulse">Đang tải dữ liệu...</div>
                            ) : transactionHistory.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">Chưa có giao dịch nào phát sinh.</div>
                            ) : (
                                <table className="w-full text-left text-sm text-gray-600">
                                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase sticky top-0">
                                        <tr>
                                            <th className="px-6 py-3">Thời gian</th>
                                            <th className="px-6 py-3">Loại giao dịch</th>
                                            <th className="px-6 py-3">Tham chiếu</th>
                                            <th className="px-6 py-3 text-right">Số lượng</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {transactionHistory.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-gray-50/80">
                                                <td className="px-6 py-3 whitespace-nowrap">{new Date(tx.transactionDate).toLocaleString('vi-VN')}</td>
                                                <td className="px-6 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        tx.transactionType.includes('IMPORT') || tx.transactionType.includes('NHẬP') 
                                                            ? 'bg-emerald-100 text-emerald-700' 
                                                            : tx.transactionType.includes('EXPORT') || tx.transactionType.includes('XUẤT')
                                                                ? 'bg-rose-100 text-rose-700' 
                                                                : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {tx.transactionType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">{tx.reference}</td>
                                                <td className={`px-6 py-3 text-right font-bold ${tx.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}