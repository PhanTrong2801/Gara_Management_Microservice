import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-orange-600">
            <AlertTriangle size={20} />
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
          <button onClick={onCancel} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-slate-600 text-center">
          <p>{message}</p>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 font-medium transition"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition shadow-lg shadow-blue-200"
          >
            Xác nhận
          </button>
        </div>

      </div>
    </div>
  );
}
