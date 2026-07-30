import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Save, AlertTriangle } from 'lucide-react';
import api from '../../api/axiosConfig';

export default function MechanicOrderDetailsModal({ isOpen, onClose, order, onSaveSuccess }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      // Deep copy to edit
      setTasks(JSON.parse(JSON.stringify(order.tasks || [])));
    }
  }, [isOpen, order]);

  const handleUpdateTaskField = (index, field, value) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    setTasks(newTasks);
  };

  const handleSaveTasks = async () => {
    try {
      setSubmitting(true);
      // Update từng task qua API
      const promises = tasks.map((task, index) => {
        return api.put(`/repair/orders/${order.id}/tasks/${index}`, {
          status: task.status,
          mechanicNote: task.mechanicNote || ""
        });
      });

      await Promise.all(promises);

      // Nếu tất cả các task đều DONE, hỏi thợ có muốn Hoàn Thành luôn phiếu không
      const allDone = tasks.every(t => t.status === 'DONE');
      if (allDone) {
        const confirmComplete = window.confirm("Tất cả công việc đã hoàn thành. Bạn có muốn đổi trạng thái Phiếu sang Đã Sửa Xong không?");
        if (confirmComplete) {
            await api.put(`/repair/orders/${order.id}/status`, 
                { status: 'COMPLETED' }
            );
        }
      }

      alert("Lưu tiến độ thành công!");
      onSaveSuccess();
    } catch (error) {
      console.error("Lỗi khi lưu tiến độ:", error);
      alert("Đã xảy ra lỗi khi lưu tiến độ.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Cập nhật hạng mục công việc</h2>
            <p className="text-sm text-slate-500 mt-1">Phiếu: {order.orderNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {tasks.length === 0 ? (
            <div className="text-center text-slate-500 italic">Không có hạng mục nào cần sửa chữa.</div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${task.status === 'DONE' ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'} shadow-sm flex flex-col gap-3 transition-colors`}>
                    
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-800 flex items-center">
                            {task.name}
                        </h4>
                        
                        <label className="flex items-center cursor-pointer">
                            <span className={`mr-2 text-sm font-medium ${task.status === 'DONE' ? 'text-green-600' : 'text-slate-500'}`}>
                                {task.status === 'DONE' ? 'Đã hoàn thành' : 'Đang chờ'}
                            </span>
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={task.status === 'DONE'}
                                    onChange={(e) => handleUpdateTaskField(idx, 'status', e.target.checked ? 'DONE' : 'PENDING')}
                                />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${task.status === 'DONE' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${task.status === 'DONE' ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Ghi chú của thợ (Tình trạng hỏng hóc, đề xuất...)</label>
                        <input
                            type="text"
                            placeholder="Ví dụ: Bố thắng mòn 80%, khuyên thay..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            value={task.mechanicNote || ''}
                            onChange={(e) => handleUpdateTaskField(idx, 'mechanicNote', e.target.value)}
                        />
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 font-medium transition"
          >
            Đóng
          </button>
          <button 
            onClick={handleSaveTasks}
            disabled={submitting}
            className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium transition flex items-center disabled:opacity-50"
          >
            <Save size={18} className="mr-2" />
            {submitting ? 'Đang lưu...' : 'Lưu Tiến Độ'}
          </button>
        </div>

      </div>
    </div>
  );
}
