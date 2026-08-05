import { useState, useEffect } from 'react';
import { Truck, Plus, X, ShoppingCart, Check, ListChecks, Search } from 'lucide-react';
import api from '../../api/axiosConfig';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';

export default function SupplierManagement() {
    const [suppliers, setSuppliers] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [parts, setParts] = useState([]);

    // Tab state: 'suppliers' or 'orders'
    const [activeTab, setActiveTab] = useState('suppliers');

    // Supplier form
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [supplierForm, setSupplierForm] = useState({ name: '', contactPhone: '', email: '', address: '' });

    // Purchase Order form
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [orderForm, setOrderForm] = useState({ supplierId: '', items: [] });
    const [selectedPartId, setSelectedPartId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unitPrice, setUnitPrice] = useState('');

    // Server-side pagination states
    const [supplierPage, setSupplierPage] = useState(1);
    const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
    const [supplierTotalPages, setSupplierTotalPages] = useState(1);
    const [supplierTotalItems, setSupplierTotalItems] = useState(0);
    const debouncedSupplierSearch = useDebounce(supplierSearchTerm, 500);

    const [orderPage, setOrderPage] = useState(1);
    const [orderSearchTerm, setOrderSearchTerm] = useState('');
    const [orderTotalPages, setOrderTotalPages] = useState(1);
    const [orderTotalItems, setOrderTotalItems] = useState(0);
    const debouncedOrderSearch = useDebounce(orderSearchTerm, 500);


    const fetchSuppliers = async () => {
        try {
            const res = await api.get(`/inventory/suppliers?page=${supplierPage - 1}&size=10&search=${debouncedSupplierSearch}`);
            setSuppliers(res.data.content || []);
            setSupplierTotalPages(res.data.totalPages || 1);
            setSupplierTotalItems(res.data.totalElements || 0);
        } catch (err) {
            console.error(err);
            setSuppliers([]);
        }
    };

    const fetchPurchaseOrders = async () => {
        try {
            const res = await api.get(`/inventory/purchase-orders?page=${orderPage - 1}&size=10&search=${debouncedOrderSearch}`);
            setPurchaseOrders(res.data.content || []);
            setOrderTotalPages(res.data.totalPages || 1);
            setOrderTotalItems(res.data.totalElements || 0);
        } catch (err) {
            console.error(err);
            setPurchaseOrders([]);
        }
    };

    const fetchParts = async () => {
        try {
            const res = await api.get('/inventory/parts?size=1000'); // temporary fetch all parts for dropdown
            setParts(res.data.content || res.data || []);
        } catch (err) {
            console.error(err);
            setParts([]);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, [supplierPage, debouncedSupplierSearch]);

    useEffect(() => {
        fetchPurchaseOrders();
    }, [orderPage, debouncedOrderSearch]);

    useEffect(() => {
        fetchParts();
    }, []);

    const handleCreateSupplier = async (e) => {
        e.preventDefault();
        try {
            await api.post('/inventory/suppliers', supplierForm);
            setIsSupplierModalOpen(false);
            setSupplierForm({ name: '', contactPhone: '', email: '', address: '' });
            fetchSuppliers();
        } catch (err) {
            alert('Lỗi tạo nhà cung cấp');
        }
    };

    const handleAddItemToOrder = () => {
        if (!selectedPartId || !quantity || !unitPrice) return;
        const part = parts.find(p => p.id === parseInt(selectedPartId));
        const newItem = {
            partId: parseInt(selectedPartId),
            partName: part?.name,
            quantity: parseInt(quantity),
            unitPrice: parseFloat(unitPrice)
        };
        setOrderForm({ ...orderForm, items: [...orderForm.items, newItem] });
        setSelectedPartId('');
        setQuantity('');
        setUnitPrice('');
    };

    const handleRemoveItem = (index) => {
        const newItems = [...orderForm.items];
        newItems.splice(index, 1);
        setOrderForm({ ...orderForm, items: newItems });
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        if (!orderForm.supplierId || orderForm.items.length === 0) {
            alert("Vui lòng chọn NCC và thêm ít nhất 1 vật tư");
            return;
        }
        try {
            await api.post('/inventory/purchase-orders', {
                supplierId: parseInt(orderForm.supplierId),
                items: orderForm.items
            });
            setIsOrderModalOpen(false);
            setOrderForm({ supplierId: '', items: [] });
            fetchPurchaseOrders();
        } catch (err) {
            alert('Lỗi tạo phiếu nhập kho');
        }
    };

    const handleCompleteOrder = async (id) => {
        if (!confirm('Hoàn tất phiếu này sẽ lập tức cộng tồn kho. Xác nhận?')) return;
        try {
            await api.patch(`/inventory/purchase-orders/${id}/complete`);
            fetchPurchaseOrders();
            fetchParts(); // Update stock info if needed elsewhere
            alert('Nhập kho thành công!');
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi hoàn tất phiếu');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Truck className="w-6 h-6 text-blue-600" />
                        Quản lý Nhà Cung Cấp & Nhập Kho
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Đối tác cung cấp phụ tùng và lịch sử nhập hàng</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.location.href = '/dashboard/inventory'}
                        className="px-4 py-2 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Quay lại Kho
                    </button>
                    {activeTab === 'suppliers' ? (
                        <button onClick={() => setIsSupplierModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                            <Plus className="w-4 h-4" /> Thêm Nhà cung cấp
                        </button>
                    ) : (
                        <button onClick={() => setIsOrderModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                            <ShoppingCart className="w-4 h-4" /> Tạo Phiếu Nhập
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'suppliers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    onClick={() => setActiveTab('suppliers')}
                >
                    Danh sách Nhà Cung Cấp
                </button>
                <button
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'orders' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    onClick={() => setActiveTab('orders')}
                >
                    Phiếu Nhập Kho (PO)
                </button>
            </div>

            {/* Tab: Danh sách NCC */}
            {activeTab === 'suppliers' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="relative w-full md:w-1/3">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm tên NCC hoặc SĐT..."
                                value={supplierSearchTerm}
                                onChange={(e) => { setSupplierSearchTerm(e.target.value); setSupplierPage(1); }}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow text-sm"
                            />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Tên Nhà Cung Cấp</th>
                                    <th className="px-6 py-4">Số điện thoại</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Địa chỉ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {suppliers.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-semibold text-gray-900">#{s.id}</td>
                                        <td className="px-6 py-4 font-medium text-blue-700">{s.name}</td>
                                        <td className="px-6 py-4">{s.contactPhone}</td>
                                        <td className="px-6 py-4">{s.email}</td>
                                        <td className="px-6 py-4">{s.address}</td>
                                    </tr>
                                ))}
                                {suppliers.length === 0 && (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Chưa có dữ liệu</td></tr>
                                )}
                            </tbody>
                        </table>
                        <Pagination
                            currentPage={supplierPage}
                            totalPages={supplierTotalPages}
                            totalItems={supplierTotalItems}
                            onPageChange={setSupplierPage}
                        />
                    </div>
                </div>
            )}

            {/* Tab: Phiếu Nhập */}
            {activeTab === 'orders' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="relative w-full md:w-1/3">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên NCC hoặc mã phiếu..."
                                value={orderSearchTerm}
                                onChange={(e) => { setOrderSearchTerm(e.target.value); setOrderPage(1); }}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow text-sm"
                            />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Mã Phiếu</th>
                                    <th className="px-6 py-4">Nhà cung cấp</th>
                                    <th className="px-6 py-4">Ngày tạo</th>
                                    <th className="px-6 py-4">Tổng tiền</th>
                                    <th className="px-6 py-4">Trạng thái</th>
                                    <th className="px-6 py-4 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {purchaseOrders.map(po => (
                                    <tr key={po.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-bold text-gray-900">PO-{po.id}</td>
                                        <td className="px-6 py-4 font-medium text-gray-800">{po.supplier?.name}</td>
                                        <td className="px-6 py-4">{new Date(po.orderDate).toLocaleString('vi-VN')}</td>
                                        <td className="px-6 py-4 font-medium text-blue-600">
                                            {po.totalAmount ? po.totalAmount.toLocaleString('vi-VN') + ' đ' : '0 đ'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${po.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                                {po.status === 'COMPLETED' ? 'Đã Nhập Kho' : 'Chờ Xử Lý'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {po.status === 'PENDING' && (
                                                <button
                                                    onClick={() => handleCompleteOrder(po.id)}
                                                    className="px-3 py-1 bg-emerald-600 text-white rounded shadow-sm hover:bg-emerald-700 transition-colors text-xs flex items-center gap-1 mx-auto"
                                                >
                                                    <Check className="w-3 h-3" /> Nhập Hàng
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {purchaseOrders.length === 0 && (
                                    <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Chưa có dữ liệu</td></tr>
                                )}
                            </tbody>
                        </table>
                        <Pagination
                            currentPage={orderPage}
                            totalPages={orderTotalPages}
                            totalItems={orderTotalItems}
                            onPageChange={setOrderPage}
                        />
                    </div>
                </div>
            )}

            {/* Modal: Thêm NCC */}
            {isSupplierModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-bold">Thêm Nhà Cung Cấp</h3>
                            <button onClick={() => setIsSupplierModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleCreateSupplier} className="p-4 space-y-4">
                            <input required placeholder="Tên công ty / Cửa hàng" className="w-full p-2 border rounded" value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} />
                            <input placeholder="Số điện thoại" className="w-full p-2 border rounded" value={supplierForm.contactPhone} onChange={e => setSupplierForm({ ...supplierForm, contactPhone: e.target.value })} />
                            <input type="email" placeholder="Email" className="w-full p-2 border rounded" value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} />
                            <input placeholder="Địa chỉ" className="w-full p-2 border rounded" value={supplierForm.address} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} />
                            <div className="flex gap-2 justify-end mt-4">
                                <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="px-4 py-2 border rounded">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Tạo Phiếu Nhập */}
            {isOrderModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-4 border-b shrink-0">
                            <h3 className="text-lg font-bold">Tạo Phiếu Nhập Kho</h3>
                            <button onClick={() => setIsOrderModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="p-4 overflow-y-auto grow space-y-4 bg-gray-50">
                            {/* Chọn NCC */}
                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                                <label className="block text-sm font-bold mb-2">1. Chọn Nhà cung cấp *</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={orderForm.supplierId}
                                    onChange={e => setOrderForm({ ...orderForm, supplierId: e.target.value })}
                                    required
                                >
                                    <option value="">-- Chọn NCC --</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            {/* Thêm Item */}
                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                                <label className="block text-sm font-bold mb-2">2. Thêm vật tư nhập</label>
                                <div className="grid grid-cols-12 gap-2 mb-3">
                                    <div className="col-span-5">
                                        <select className="w-full p-2 border rounded text-sm" value={selectedPartId} onChange={e => setSelectedPartId(e.target.value)}>
                                            <option value="">-- Chọn Phụ Tùng --</option>
                                            {parts
                                                .filter(p => p.supplier && p.supplier.id === parseInt(orderForm.supplierId))
                                                .map(p => <option key={p.id} value={p.id}>{p.name} (Tồn: {p.stockQuantity})</option>)
                                            }
                                        </select>
                                    </div>
                                    <div className="col-span-3">
                                        <input type="number" min="1" placeholder="Số lượng" className="w-full p-2 border rounded text-sm" value={quantity} onChange={e => setQuantity(e.target.value)} />
                                    </div>
                                    <div className="col-span-3">
                                        <input type="number" min="0" placeholder="Đơn giá nhập" className="w-full p-2 border rounded text-sm" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
                                    </div>
                                    <div className="col-span-1">
                                        <button onClick={handleAddItemToOrder} type="button" className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex justify-center items-center">
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Bảng Item đã chọn */}
                                {orderForm.items.length > 0 && (
                                    <table className="w-full text-left text-sm border mt-4">
                                        <thead className="bg-gray-100 border-b">
                                            <tr>
                                                <th className="p-2">Vật tư</th>
                                                <th className="p-2">SL</th>
                                                <th className="p-2 text-right">Đơn giá</th>
                                                <th className="p-2 text-right">Thành tiền</th>
                                                <th className="p-2 text-center">Xóa</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderForm.items.map((it, idx) => (
                                                <tr key={idx} className="border-b">
                                                    <td className="p-2 font-medium">{it.partName}</td>
                                                    <td className="p-2">{it.quantity}</td>
                                                    <td className="p-2 text-right">{(it.unitPrice).toLocaleString()}</td>
                                                    <td className="p-2 text-right text-blue-600">{(it.quantity * it.unitPrice).toLocaleString()}</td>
                                                    <td className="p-2 text-center">
                                                        <button onClick={() => handleRemoveItem(idx)} className="text-red-500 font-bold">X</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-50 font-bold">
                                                <td colSpan="3" className="p-2 text-right">Tổng cộng:</td>
                                                <td className="p-2 text-right text-rose-600">
                                                    {orderForm.items.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0).toLocaleString()} đ
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                        <div className="p-4 border-t flex justify-end gap-3 shrink-0 bg-white">
                            <button type="button" onClick={() => setIsOrderModalOpen(false)} className="px-4 py-2 border rounded font-medium">Hủy</button>
                            <button onClick={handleCreateOrder} className="px-6 py-2 bg-emerald-600 text-white rounded font-bold flex items-center gap-2">
                                <ListChecks className="w-4 h-4" /> Tạo Phiếu Nhập
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
