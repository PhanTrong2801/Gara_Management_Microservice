import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, PenTool, CheckCircle } from 'lucide-react';
import api from '../../api/axiosConfig';
import toast from 'react-hot-toast';
import SearchableSelect from '../../components/common/SearchableSelect';

export default function RepairOrderDetailsModal({ isOpen, onClose, order, onSaveSuccess }) {
  const [tasks, setTasks] = useState([]);
  const [parts, setParts] = useState([]);
  
  const [availableParts, setAvailableParts] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeMechanics, setActiveMechanics] = useState([]);
  const [selectedMechanicId, setSelectedMechanicId] = useState('');

  const role = localStorage.getItem('role') || '';
  const isMechanic = ['ROLE_MECHANIC', 'MECHANIC'].includes(role.toUpperCase());

  useEffect(() => {
    if (isOpen && order) {
      setTasks(order.tasks || []);
      setParts(order.parts || []);
      setSelectedMechanicId(order.mechanicId || '');
      fetchCatalog();
      if (!isMechanic) {
        fetchActiveMechanics();
      }
    }
  }, [isOpen, order]);

  const fetchActiveMechanics = async () => {
    try {
      const res = await api.get('/auth/attendance/active-mechanics');
      let mechanics = res.data || [];
      
      if (order?.mechanicId && !mechanics.some(m => m.id === order.mechanicId)) {
        try {
          const userRes = await api.get(`/auth/users`);
          if (userRes.data && Array.isArray(userRes.data)) {
             const user = userRes.data.find(u => u.id === order.mechanicId);
             if (user) {
               mechanics.push({
                 ...user,
                 fullName: user.fullName + " (Đã checkout)"
               });
             }
          }
        } catch (e) {
          console.error("Không thể lấy thông tin thợ đã gán", e);
        }
      }
      
      setActiveMechanics(mechanics);
    } catch (error) {
      console.error('Lỗi lấy danh sách thợ:', error);
    }
  };

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const [partsRes, servicesRes] = await Promise.all([
        api.get('/inventory/parts'),
        api.get('/repair/service-catalog')
      ]);
      const partsData = partsRes.data.content || partsRes.data;
      const servicesData = servicesRes.data.content || servicesRes.data;
      
      setAvailableParts(Array.isArray(partsData) ? partsData : []);
      setAvailableServices(Array.isArray(servicesData) ? servicesData : []);
    } catch (error) {
      console.error('Lỗi tải danh mục:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = () => {
    setTasks([...tasks, { serviceCatalogId: '', name: '', cost: 0 }]);
  };

  const handleUpdateTask = (index, field, value) => {
    const updatedTasks = [...tasks];
    if (field === 'serviceCatalogId') {
      const selectedSvc = availableServices.find(s => s.id === value);
      if (selectedSvc) {
        updatedTasks[index].serviceCatalogId = selectedSvc.id;
        updatedTasks[index].name = selectedSvc.name;
        updatedTasks[index].cost = selectedSvc.defaultCost;
      }
    } else {
      updatedTasks[index][field] = value;
    }
    setTasks(updatedTasks);
  };

  const handleRemoveTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleAddPart = () => {
    setParts([...parts, { partId: '', partName: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleUpdatePart = (index, field, value) => {
    const updatedParts = [...parts];
    if (field === 'partId') {
      const selectedPart = availableParts.find(p => p.id.toString() === value);
      if (selectedPart) {
        updatedParts[index].partId = selectedPart.id;
        updatedParts[index].partName = selectedPart.name;
        updatedParts[index].unitPrice = selectedPart.price;
      }
    } else {
      updatedParts[index][field] = value;
    }
    setParts(updatedParts);
  };

  const handleRemovePart = (index) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/repair/orders/${order.id}/details`, {
        tasks: tasks,
        parts: parts
      });
      
      // Nếu có chọn thợ thì gọi thêm API gán thợ
      if (selectedMechanicId && selectedMechanicId !== order.mechanicId) {
        await api.put(`/repair/orders/${order.id}/status`, {
          status: order.status,
          mechanicId: selectedMechanicId
        });
      }

      toast.success('Đã cập nhật chi tiết phiếu sửa chữa!');
      onSaveSuccess();
    } catch (error) {
      console.error('Lỗi khi lưu:', error);
      toast.error('Không thể lưu chi tiết phiếu sửa chữa.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !order) return null;

  const mechanicOptions = activeMechanics.map(m => ({
    value: m.id,
    label: `${m.fullName} (${m.username}) - ${m.phone || 'N/A'}`
  }));

  const serviceOptions = availableServices.map(svc => ({
    value: svc.id,
    label: `${svc.name} ${!isMechanic ? `- ${svc.defaultCost.toLocaleString()} VNĐ` : ''}`
  }));

  const partOptions = availableParts.map(ap => ({
    value: ap.id,
    label: `${ap.name} - Tồn: ${ap.stockQuantity} cái ${!isMechanic ? `- Giá: ${ap.price.toLocaleString()} VNĐ` : ''}`
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Chi tiết phiếu sửa chữa</h2>
            <p className="text-sm text-gray-500 mt-1">Mã phiếu: {order.orderNumber} - Trạng thái: {order.status}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}  
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Điều phối thợ */}
          {!isMechanic && (
            <section className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-yellow-800 mb-3">
                👩‍🔧 Điều phối thợ sửa chữa
              </h3>
              <div className="flex gap-4 items-center">
                <SearchableSelect 
                  className="flex-1 text-sm bg-white"
                  options={mechanicOptions}
                  value={selectedMechanicId}
                  onChange={(val) => setSelectedMechanicId(val)}
                  placeholder="-- Chọn thợ đang có mặt --"
                  noOptionsMessage="Không tìm thấy thợ này"
                />
                <div className="text-sm text-yellow-700 italic">
                  Chỉ những thợ đã điểm danh hôm nay mới hiển thị ở đây.
                </div>
              </div>
            </section>
          )}

          {/* Tiền công */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                <PenTool className="w-5 h-5 text-blue-600" /> Công thợ & Dịch vụ
              </h3>
              <button onClick={handleAddTask} className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:bg-blue-50 px-3 py-1.5 rounded-lg transition">
                <Plus className="w-4 h-4" /> Thêm công việc
              </button>
            </div>
            
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Chưa có công việc nào được thêm.</p>
              ) : (
                tasks.map((task, idx) => (
                  <div key={idx} className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex gap-4 items-center">
                      <SearchableSelect 
                        className="flex-1 text-sm bg-white"
                        options={serviceOptions}
                        value={task.serviceCatalogId}
                        onChange={(val) => handleUpdateTask(idx, 'serviceCatalogId', val ? val.toString() : '')}
                        placeholder="-- Chọn dịch vụ --"
                        noOptionsMessage="Không tìm thấy dịch vụ"
                      />

                      {/* Chỉ Admin/Manager/Receptionist mới thấy giá và sửa giá */}
                      {!isMechanic && (
                        <input 
                          type="number" 
                          placeholder="Tiền công (VNĐ)"
                          className="w-40 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={task.cost}
                          onChange={(e) => handleUpdateTask(idx, 'cost', Number(e.target.value))}
                        />
                      )}

                      <button onClick={() => handleRemoveTask(idx)} className="text-red-500 hover:text-red-700 p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Hiển thị Ghi chú thợ và Trạng thái cho Manager */}
                    {!isMechanic && (task.mechanicNote || task.status) && (
                      <div className="flex items-center gap-2 pl-1 mt-1 text-sm">
                        {task.status === 'DONE' ? (
                            <span className="text-green-600 font-medium flex items-center bg-green-100 px-2 py-0.5 rounded text-xs"><CheckCircle className="w-3 h-3 mr-1"/> Xong</span>
                        ) : (
                            <span className="text-orange-600 font-medium flex items-center bg-orange-100 px-2 py-0.5 rounded text-xs">Đang chờ</span>
                        )}
                        {task.mechanicNote && (
                            <span className="text-gray-600 italic border-l-2 border-purple-300 pl-2">Thợ nhắn: <span className="font-medium text-purple-700">{task.mechanicNote}</span></span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Phụ tùng */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                <PenTool className="w-5 h-5 text-purple-600" /> Phụ tùng thay thế
              </h3>
              <button onClick={handleAddPart} className="flex items-center gap-1 text-sm text-purple-600 font-medium hover:bg-purple-50 px-3 py-1.5 rounded-lg transition">
                <Plus className="w-4 h-4" /> Thêm phụ tùng
              </button>
            </div>
            
            <div className="space-y-3">
              {parts.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Chưa có phụ tùng nào được sử dụng.</p>
              ) : (
                parts.map((part, idx) => (
                  <div key={idx} className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg">
                    <SearchableSelect 
                      className="flex-1 text-sm bg-white"
                      options={partOptions}
                      value={part.partId}
                      onChange={(val) => handleUpdatePart(idx, 'partId', val ? val.toString() : '')}
                      placeholder="-- Chọn phụ tùng từ kho --"
                      noOptionsMessage="Không tìm thấy phụ tùng"
                    />
                    
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Số lượng"
                      className="w-24 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={part.quantity}
                      onChange={(e) => handleUpdatePart(idx, 'quantity', Number(e.target.value))}
                    />

                    {/* Chỉ hiện Thành tiền nếu KHÔNG phải thợ máy */}
                    {!isMechanic && (
                      <div className="w-32 text-right text-sm font-medium text-gray-700">
                        {(part.quantity * part.unitPrice || 0).toLocaleString()} VNĐ
                      </div>
                    )}

                    <button onClick={() => handleRemovePart(idx)} className="text-red-500 hover:text-red-700 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Summary - Bị ẩn đối với thợ máy */}
          {!isMechanic && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
              <span className="font-medium text-blue-900">Tạm tính:</span>
              <span className="text-xl font-bold text-blue-700">
                {(
                  tasks.reduce((sum, t) => sum + (Number(t.cost) || 0), 0) +
                  parts.reduce((sum, p) => sum + ((Number(p.quantity) || 0) * (Number(p.unitPrice) || 0)), 0)
                ).toLocaleString()} VNĐ
              </span>
            </div>
          )}

          {/* Customer Signature - Bị ẩn đối với thợ máy */}
          {!isMechanic && order.customerApproved && order.customerSignatureBase64 && (
            <section className="bg-green-50 p-4 rounded-xl border border-green-200 mt-4 flex flex-col items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-green-800 mb-2">
                <CheckCircle className="w-5 h-5" /> Khách hàng đã ký xác nhận trực tuyến
              </h3>
              <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-sm">
                <img src={`data:image/png;base64,${order.customerSignatureBase64}`} alt="Chữ ký khách hàng" className="h-24 object-contain" />
              </div>
            </section>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition">
            Hủy bỏ
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : <><Save className="w-4 h-4" /> Lưu thông tin</>}
          </button>
        </div>
      </div>
    </div>
  );
}
