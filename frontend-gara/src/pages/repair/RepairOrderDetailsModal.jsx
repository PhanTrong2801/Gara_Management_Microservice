import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, PenTool } from 'lucide-react';
import api from '../../api/axiosConfig';

export default function RepairOrderDetailsModal({ isOpen, onClose, order, onSaveSuccess }) {
  const [tasks, setTasks] = useState([]);
  const [parts, setParts] = useState([]);
  
  const [availableParts, setAvailableParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      setTasks(order.tasks || []);
      setParts(order.parts || []);
      fetchAvailableParts();
    }
  }, [isOpen, order]);

  const fetchAvailableParts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inventory/parts');
      setAvailableParts(response.data);
    } catch (error) {
      console.error('Lỗi tải danh sách phụ tùng:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = () => {
    setTasks([...tasks, { name: '', cost: 0 }]);
  };

  const handleUpdateTask = (index, field, value) => {
    const updatedTasks = [...tasks];
    updatedTasks[index][field] = value;
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
      alert('Đã cập nhật chi tiết phiếu sửa chữa!');
      onSaveSuccess();
    } catch (error) {
      console.error('Lỗi khi lưu:', error);
      alert('Không thể lưu chi tiết phiếu sửa chữa.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !order) return null;

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
                  <div key={idx} className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg">
                    <input 
                      type="text" 
                      placeholder="Tên công việc (VD: Thay nhớt máy)"
                      className="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={task.name}
                      onChange={(e) => handleUpdateTask(idx, 'name', e.target.value)}
                    />
                    <input 
                      type="number" 
                      placeholder="Tiền công (VNĐ)"
                      className="w-40 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={task.cost}
                      onChange={(e) => handleUpdateTask(idx, 'cost', Number(e.target.value))}
                    />
                    <button onClick={() => handleRemoveTask(idx)} className="text-red-500 hover:text-red-700 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                    <select 
                      className="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={part.partId || ''}
                      onChange={(e) => handleUpdatePart(idx, 'partId', e.target.value)}
                    >
                      <option value="">-- Chọn phụ tùng từ kho --</option>
                      {availableParts.map(ap => (
                        <option key={ap.id} value={ap.id}>
                          {ap.name} - Tồn: {ap.quantity} cái - Giá: {ap.price.toLocaleString()} VNĐ
                        </option>
                      ))}
                    </select>
                    
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Số lượng"
                      className="w-24 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={part.quantity}
                      onChange={(e) => handleUpdatePart(idx, 'quantity', Number(e.target.value))}
                    />

                    <div className="w-32 text-right text-sm font-medium text-gray-700">
                      {(part.quantity * part.unitPrice || 0).toLocaleString()} VNĐ
                    </div>

                    <button onClick={() => handleRemovePart(idx)} className="text-red-500 hover:text-red-700 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Summary */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
            <span className="font-medium text-blue-900">Tạm tính:</span>
            <span className="text-xl font-bold text-blue-700">
              {(
                tasks.reduce((sum, t) => sum + (Number(t.cost) || 0), 0) +
                parts.reduce((sum, p) => sum + ((Number(p.quantity) || 0) * (Number(p.unitPrice) || 0)), 0)
              ).toLocaleString()} VNĐ
            </span>
          </div>

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
