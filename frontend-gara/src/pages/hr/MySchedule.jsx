import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axiosConfig';
import { Calendar, Clock, CheckCircle, AlertTriangle, X, Play, Clock3, Plus } from 'lucide-react';

export default function MySchedule() {
  const [shifts, setShifts] = useState([]);
  const [mySchedules, setMySchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Lấy userId từ localStorage hoặc từ JWT Token
  const getUserId = () => {
    let id = localStorage.getItem('userId');
    if (id) return id;
    
    // Nếu không có trong localStorage thì giải mã từ token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        const decodedJson = atob(payloadBase64);
        const decoded = JSON.parse(decodedJson);
        if (decoded.userId) {
          localStorage.setItem('userId', decoded.userId);
          return decoded.userId;
        }
      } catch (e) {
        console.error("Lỗi giải mã token", e);
      }
    }
    return null;
  };

  const userId = getUserId();

  // Start Date / End Date for Week View
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1); // Thứ 2
    return d.toISOString().split('T')[0];
  });
  
  const [currentWeekEnd, setCurrentWeekEnd] = useState(() => {
    const d = new Date();
    const start = new Date(currentWeekStart);
    d.setDate(start.getDate() + 6); // Chủ Nhật
    return d.toISOString().split('T')[0];
  });

  // Sync End Date when Start Date changes
  useEffect(() => {
    const start = new Date(currentWeekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    setCurrentWeekEnd(end.toISOString().split('T')[0]);
  }, [currentWeekStart]);

  useEffect(() => {
    fetchShifts();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchMySchedules();
    }
  }, [currentWeekStart, currentWeekEnd, userId]);

  const fetchShifts = async () => {
    try {
      const res = await api.get('/auth/schedules/shifts');
      setShifts(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách ca", error);
    }
  };

  const fetchMySchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/auth/schedules/users/${userId}?startDate=${currentWeekStart}&endDate=${currentWeekEnd}`);
      setMySchedules(res.data);
    } catch (error) {
      console.error("Lỗi lấy lịch làm việc cá nhân", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterShift = async (shiftId, workDate) => {
    try {
      const payload = {
        userId: userId,
        shiftId: shiftId,
        workDate: workDate
      };
      await api.post('/auth/schedules/register', payload);
      alert("Đăng ký thành công! Vui lòng chờ quản lý duyệt.");
      fetchMySchedules();
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data || "Lỗi khi đăng ký ca!";
      alert(typeof msg === 'string' ? msg : "Đã xảy ra lỗi hệ thống khi đăng ký.");
    }
  };

  // Generate 7 days of the week based on currentWeekStart
  const daysOfWeek = useMemo(() => {
    const days = [];
    const start = new Date(currentWeekStart);
    for (let i = 0; i < 7; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      const dayName = current.toLocaleDateString('vi-VN', { weekday: 'long' });
      days.push({ date: dateStr, dayName, shortDate: current.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) });
    }
    return days;
  }, [currentWeekStart]);

  // Status Badge Config
  const getStatusBadge = (status) => {
    switch(status) {
      case 'PENDING_APPROVAL':
        return <span className="flex items-center text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200"><Clock3 className="w-3 h-3 mr-1"/> Chờ duyệt</span>;
      case 'SCHEDULED':
      case 'ASSIGNED_BY_MANAGER':
        return <span className="flex items-center text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200"><CheckCircle className="w-3 h-3 mr-1"/> Đã xếp lịch</span>;
      case 'REJECTED':
        return <span className="flex items-center text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold border border-rose-200"><X className="w-3 h-3 mr-1"/> Từ chối</span>;
      default:
        return <span className="flex items-center text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold border border-slate-200">{status}</span>;
    }
  };

  if (!userId) {
    return <div className="p-8 text-center text-rose-500">Lỗi: Không tìm thấy thông tin nhân viên đang đăng nhập.</div>;
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Lịch Làm Việc Của Tôi</h1>
          <p className="text-slate-500 mt-2">Đăng ký ca làm và theo dõi lịch được phân công</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Week Selector Bar */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-slate-500" />
            <span className="font-semibold text-slate-700">Tuần làm việc:</span>
            <input 
              type="date" 
              className="p-2 border border-slate-300 rounded-lg text-sm focus:outline-blue-500" 
              value={currentWeekStart} 
              onChange={e => setCurrentWeekStart(e.target.value)}
            />
            <span className="text-slate-500">đến</span>
            <span className="font-semibold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg text-sm">{currentWeekEnd.split('-').reverse().join('/')}</span>
          </div>
          <div className="text-xs text-slate-500 italic bg-blue-50 border border-blue-200 text-blue-800 p-2 rounded-lg">
            💡 Bạn có thể đăng ký nhiều ca khác nhau trong cùng một ngày.
          </div>
        </div>

        {loading ? (
           <div className="text-center p-12 text-slate-500 animate-pulse">Đang tải lịch...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {daysOfWeek.map(day => (
              <div key={day.date} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
                {/* Day Header */}
                <div className="p-3 bg-slate-100 border-b border-slate-200 text-center">
                  <div className="font-bold text-slate-700 text-sm capitalize">{day.dayName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{day.shortDate}</div>
                </div>

                {/* Shift list for this day */}
                <div className="p-3 space-y-4 flex-1 flex flex-col justify-start">
                  {shifts.map(shift => {
                    // Tìm xem user đã đăng ký/được xếp ca này chưa
                    const myShift = mySchedules.find(s => s.workDate === day.date && s.shiftId === shift.id);
                    
                    return (
                      <div 
                        key={shift.id} 
                        className={`p-3 rounded-lg border flex flex-col transition relative group ${
                          myShift ? (myShift.status === 'REJECTED' ? 'bg-rose-50/50 border-rose-200' : 'bg-blue-50 border-blue-200') : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Shift Title */}
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-xs text-slate-800 uppercase">{shift.shiftName}</span>
                          <span className="text-[10px] text-slate-500 font-semibold bg-white px-1.5 py-0.5 rounded border">
                            {shift.startTime.slice(0,5)}-{shift.endTime.slice(0,5)}
                          </span>
                        </div>

                        {/* Registration Status or Button */}
                        <div className="mt-auto pt-2 border-t border-dashed border-slate-200 flex justify-center items-center h-8">
                          {myShift ? (
                            getStatusBadge(myShift.status)
                          ) : (
                            <button 
                              onClick={() => handleRegisterShift(shift.id, day.date)}
                              className="w-full py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white border border-slate-200 text-slate-600 rounded text-[11px] font-bold flex items-center justify-center transition duration-200"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> Đăng ký ca
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
