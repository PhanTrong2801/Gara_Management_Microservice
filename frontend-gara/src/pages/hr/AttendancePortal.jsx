import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, RefreshCcw, CheckCircle, User, AlertCircle, Copy } from 'lucide-react';

export default function AttendancePortal() {
  const [token, setToken] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkedInUsers, setCheckedInUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch QR Token
  const fetchQrToken = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/auth/attendance/qr-token');
      setToken(res.data.token);
      setCountdown(30);
    } catch (error) {
      console.error("Lỗi lấy QR Token", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Lấy danh sách đã chấm công hôm nay
  const fetchCheckedInUsers = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get(`/auth/schedules?startDate=${today}&endDate=${today}`);
      const todaySchedules = res.data;
      const checkedIn = todaySchedules.filter(s => s.checkInTime !== null);
      // Sắp xếp người mới check-in lên đầu
      checkedIn.sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));
      setCheckedInUsers(checkedIn);
    } catch (error) {
      console.error("Lỗi lấy danh sách chấm công", error);
    }
  };

  useEffect(() => {
    fetchQrToken();
    fetchCheckedInUsers();
    
    // Đồng hồ thời gian thực
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Đếm ngược QR và fetch mới
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchQrToken();
          fetchCheckedInUsers();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  const copyTokenForTesting = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      alert("Đã Copy QR Token vào Clipboard (Dùng để test trên Máy ảo)");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      
      {/* LEFT: QR Code Scanner Section */}
      <div className="lg:w-2/3 flex flex-col items-center justify-center p-8 relative">
        
        <div className="absolute top-8 left-8">
          <div className="flex items-center text-blue-400 font-bold text-2xl tracking-widest uppercase">
            <div className="w-10 h-10 bg-blue-500 rounded-lg mr-3 flex items-center justify-center">
              <span className="text-white text-xl">G</span>
            </div>
            Gara Check-In
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-7xl font-black text-white tracking-tight tabular-nums">
            {currentTime.toLocaleTimeString('vi-VN', { hour12: false })}
          </h1>
          <p className="text-xl text-slate-400 mt-2 font-medium">
            {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-2xl relative">
          <div className="absolute -top-4 -right-4 bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl border-4 border-slate-900 shadow-lg transition-transform duration-300 transform scale-110">
            {countdown}
          </div>
          
          <div className="w-72 h-72 flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden">
            {isLoading && !token ? (
              <RefreshCcw className="w-10 h-10 text-slate-300 animate-spin" />
            ) : token ? (
              <QRCodeSVG 
                value={token} 
                size={250} 
                level={"H"}
                includeMargin={false}
                imageSettings={{
                  src: "https://cdn-icons-png.flaticon.com/512/3202/3202926.png",
                  x: undefined,
                  y: undefined,
                  height: 48,
                  width: 48,
                  excavate: true,
                }}
              />
            ) : (
              <AlertCircle className="w-10 h-10 text-rose-500" />
            )}
          </div>
        </div>
        
        <p className="mt-8 text-xl text-slate-300 font-semibold text-center">
          Vui lòng mở <span className="text-blue-400">Ứng dụng Gara</span> và quét mã để Chấm công
        </p>
        <p className="text-sm text-slate-500 mt-2">Mã QR tự động làm mới để bảo mật</p>

        {/* Nút Test Ẩn */}
        <button 
          onClick={copyTokenForTesting}
          className="absolute bottom-8 left-8 flex items-center px-4 py-2 bg-slate-800 text-slate-500 rounded-full hover:bg-slate-700 hover:text-white transition text-sm opacity-30 hover:opacity-100"
          title="Nút ẩn dành cho Dev test trên Máy ảo"
        >
          <Copy className="w-4 h-4 mr-2" /> Copy Token (Test)
        </button>

      </div>

      {/* RIGHT: Live Feed */}
      <div className="lg:w-1/3 bg-slate-800 border-l border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700 bg-slate-800/50">
          <h2 className="text-xl font-bold flex items-center">
            <CheckCircle className="w-6 h-6 text-emerald-400 mr-2" /> 
            Đã Chấm Công Hôm Nay
            <span className="ml-auto bg-slate-700 text-sm py-1 px-3 rounded-full font-bold">
              {checkedInUsers.length}
            </span>
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {checkedInUsers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <User className="w-16 h-16 mb-4 opacity-20" />
              <p>Chưa có ai chấm công</p>
            </div>
          ) : (
            checkedInUsers.map((schedule, idx) => (
              <div 
                key={schedule.id} 
                className={`flex items-center p-4 rounded-xl transition-all duration-500 transform 
                  ${idx === 0 ? 'bg-emerald-500/10 border border-emerald-500/20 translate-y-0 opacity-100 scale-100' : 'bg-slate-700/50 border border-transparent opacity-70 scale-95'}
                `}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mr-4
                  ${idx === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-slate-300'}
                `}>
                  {schedule.fullName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg text-white">{schedule.fullName}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">{schedule.roleName === 'MECHANIC' ? 'Thợ Máy' : 'Lễ Tân'}</div>
                </div>
                <div className="text-right">
                  <div className={`font-black text-xl tabular-nums ${idx === 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {new Date(schedule.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {schedule.lateMinutes > 0 ? (
                    <div className="text-xs text-rose-400 font-bold bg-rose-400/10 px-2 py-0.5 rounded mt-1">
                      Trễ {schedule.lateMinutes}p
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded mt-1">
                      Đúng giờ
                    </div>
                  )}
                  {schedule.autoCheckout && (
                    <div className="text-xs text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded mt-1">
                      ⚠️ Quên checkout
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
