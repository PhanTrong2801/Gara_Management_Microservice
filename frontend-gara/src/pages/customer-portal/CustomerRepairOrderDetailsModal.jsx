import React from 'react';
import { X, PenTool, Wrench, CircleDollarSign } from 'lucide-react';

export default function CustomerRepairOrderDetailsModal({ isOpen, onClose, order }) {
    if (!isOpen || !order) return null;

    const tasks = order.tasks || [];
    const parts = order.parts || [];

    const totalCost = 
        tasks.reduce((sum, t) => sum + (Number(t.cost) || 0), 0) +
        parts.reduce((sum, p) => sum + ((Number(p.quantity) || 0) * (Number(p.unitPrice) || 0)), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Chi tiết Phiếu Sửa Chữa</h2>
                        <p className="text-sm text-slate-500 mt-1">Mã phiếu: <span className="font-semibold text-blue-600">{order.orderNumber}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Tiền công */}
                    <section>
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 mb-4 pb-2 border-b">
                            <PenTool className="w-5 h-5 text-blue-600" /> Công thợ & Dịch vụ
                        </h3>
                        
                        <div className="space-y-3">
                            {tasks.length === 0 ? (
                                <p className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-lg text-center">Chưa có công việc nào được ghi nhận.</p>
                            ) : (
                                tasks.map((task, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <span className="font-medium text-slate-700">{task.name}</span>
                                        <span className="font-bold text-slate-800">{Number(task.cost).toLocaleString('vi-VN')} VNĐ</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Phụ tùng */}
                    <section>
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 mb-4 pb-2 border-b">
                            <Wrench className="w-5 h-5 text-purple-600" /> Phụ tùng thay thế
                        </h3>
                        
                        <div className="space-y-3">
                            {parts.length === 0 ? (
                                <p className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-lg text-center">Chưa có phụ tùng nào được sử dụng.</p>
                            ) : (
                                parts.map((part, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 p-4 rounded-xl border border-slate-100 gap-2 sm:gap-0">
                                        <div>
                                            <span className="font-medium text-slate-700 block">{part.partName}</span>
                                            <span className="text-sm text-slate-500">Đơn giá: {Number(part.unitPrice).toLocaleString('vi-VN')} VNĐ</span>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end sm:gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200">
                                            <span className="text-sm text-slate-600 font-medium">SL: <span className="text-slate-800 bg-white px-2 py-1 rounded-md border">{part.quantity}</span></span>
                                            <span className="font-bold text-slate-800">
                                                {(Number(part.quantity) * Number(part.unitPrice)).toLocaleString('vi-VN')} VNĐ
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* Footer (Total) */}
                <div className="p-6 border-t bg-slate-50 rounded-b-2xl">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 rounded-xl shadow-md flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                            <CircleDollarSign className="w-6 h-6 text-blue-100" />
                            <span className="font-medium text-lg">Tổng chi phí tạm tính:</span>
                        </div>
                        <span className="text-2xl font-bold">
                            {totalCost.toLocaleString('vi-VN')} VNĐ
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
