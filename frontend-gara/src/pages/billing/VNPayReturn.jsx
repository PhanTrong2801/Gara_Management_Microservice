import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../../api/axiosConfig';
import toast from 'react-hot-toast';

export default function VNPayReturn() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Đang xử lý kết quả thanh toán...');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const processPaymentReturn = async () => {
      // Lấy toàn bộ query params từ URL
      const searchParams = new URLSearchParams(location.search);
      const params = Object.fromEntries(searchParams.entries());

      if (Object.keys(params).length === 0) {
        setStatus('error');
        setMessage('Không tìm thấy thông tin giao dịch.');
        return;
      }

      try {
        const response = await api.post('/billing/vnpay/payment-return', params);
        if (response.data.status === 'SUCCESS') {
          setStatus('success');
          setMessage(`Giao dịch thành công! Mã giao dịch: ${params.vnp_TransactionNo}`);
          toast.success('Thanh toán VNPay thành công!');
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Giao dịch thất bại!');
          toast.error(response.data.message || 'Giao dịch VNPay thất bại!');
        }
      } catch (error) {
        console.error("Lỗi callback VNPay:", error);
        setStatus('error');
        setMessage('Lỗi kết nối đến máy chủ xác nhận thanh toán.');
        toast.error('Lỗi kết nối khi xác nhận thanh toán.');
      }
    };

    processPaymentReturn();
  }, [location]);

  // Tự động quay về trang Thu ngân sau 3 giây
  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/dashboard/billing');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-slate-100">
        {status === 'processing' && (
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Đang xử lý...</h2>
            <p className="text-slate-500">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-black text-emerald-600 mb-2 uppercase">Thanh toán thành công!</h2>
            <p className="text-slate-600 mb-4">{message}</p>
            <p className="text-sm text-slate-400 mb-6">Tự động chuyển trang sau {countdown} giây...</p>
            <button 
              onClick={() => navigate('/dashboard/billing')}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition"
            >
              Trở về trang Thu ngân ngay
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-black text-red-600 mb-2 uppercase">Giao dịch thất bại!</h2>
            <p className="text-slate-600 mb-4">{message}</p>
            <p className="text-sm text-slate-400 mb-6">Tự động chuyển trang sau {countdown} giây...</p>
            <button 
              onClick={() => navigate('/dashboard/billing')}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition"
            >
              Trở về trang Thu ngân ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
