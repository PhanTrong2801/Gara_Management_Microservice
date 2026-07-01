import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axiosConfig';
import { Plus, Trash2, Calendar, Clock, User, CheckCircle, AlertTriangle, X, Edit } from 'lucide-react';

export default function ShiftManagement() {
  const [activeTab, setActiveTab] = useState('schedules'); // schedules | shifts
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [pendingSchedules, setPendingSchedules] = useState([]);

  // Modal State for Assigning Shift
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // For defining a new shift type
  const [newShift, setNewShift] = useState({ shiftName: '', startTime: '', endTime: '', description: '' });
  const [editingShift, setEditingShift] = useState(null);

  // For assigning a shift
  const [newSchedule, setNewSchedule] = useState({ 
    userId: '', 
    shiftId: '', 
    workDate: new Date().toISOString().split('T')[0], 
    note: '' 
  });

  // Start Date / End Date for Week View
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1); // Monday
    return d.toISOString().split('T')[0];
  });
  
  const [currentWeekEnd, setCurrentWeekEnd] = useState(() => {
    const d = new Date();
    const start = new Date(currentWeekStart);
    d.setDate(start.getDate() + 6); // Sunday
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
    fetchUsers();
    fetchPendingSchedules();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [currentWeekStart, currentWeekEnd]);

  const fetchShifts = async () => {
    try {
      const res = await api.get('/auth/schedules/shifts');
      setShifts(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách ca", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      const staff = res.data.filter(u => u.role === 'MECHANIC' || u.role === 'RECEPTIONIST' || u.role === 'ROLE_MECHANIC');
      setUsers(staff);
    } catch (error) {
      console.error("Lỗi lấy danh sách nhân viên", error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await api.get(`/auth/schedules?startDate=${currentWeekStart}&endDate=${currentWeekEnd}`);
      setSchedules(res.data);
    } catch (error) {
      console.error("Lỗi lấy lịch làm việc", error);
    }
  };

  const fetchPendingSchedules = async () => {
    try {
      const res = await api.get('/auth/schedules/pending');
      setPendingSchedules(res.data);
    } catch (error) {
      console.error("Lỗi lấy lịch chờ duyệt", error);
    }
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newShift,
        startTime: newShift.startTime.length === 5 ? newShift.startTime + ':00' : newShift.startTime,
        endTime: newShift.endTime.length === 5 ? newShift.endTime + ':00' : newShift.endTime,
      };
      await api.post('/auth/schedules/shifts', payload);
      setNewShift({ shiftName: '', startTime: '', endTime: '', description: '' });
      fetchShifts();
      alert("Tạo ca làm việc thành công!");
    } catch (error) {
      alert("Có lỗi xảy ra khi tạo ca!");
    }
  };

  const handleUpdateShift = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editingShift,
        startTime: editingShift.startTime.length === 5 ? editingShift.startTime + ':00' : editingShift.startTime,
        endTime: editingShift.endTime.length === 5 ? editingShift.endTime + ':00' : editingShift.endTime,
      };
      await api.put(`/auth/schedules/shifts/${editingShift.id}`, payload);
      setEditingShift(null);
      fetchShifts();
      alert("Cập nhật ca làm việc thành công!");
    } catch (error) {
      alert("Có lỗi xảy ra khi cập nhật ca!");
    }
  };

  const handleDeleteShift = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa ca mẫu này? Mọi lịch phân công liên quan có thể bị ảnh hưởng.")) return;
    try {
      await api.delete(`/auth/schedules/shifts/${id}`);
      fetchShifts();
      alert("Xóa ca mẫu thành công!");
    } catch (error) {
      alert("Có lỗi xảy ra khi xóa ca mẫu!");
    }
  };

  const handleAssignSchedule = async (e) => {
    e.preventDefault();
    if (!newSchedule.userId || !newSchedule.shiftId || !newSchedule.workDate) return alert("Vui lòng điền đủ thông tin");
    try {
      await api.post('/auth/schedules', newSchedule);
      fetchSchedules();
      setNewSchedule({ userId: '', shiftId: '', workDate: new Date().toISOString().split('T')[0], note: '' });
      setIsAssignModalOpen(false);
    } catch (error) {
      alert("Lỗi khi phân công ca!");
    }
  };

  const handleDeleteSchedule = async (id) => {
    if(!window.confirm("Bạn có chắc muốn xóa phân công này?")) return;
    try {
      await api.delete(`/auth/schedules/${id}`);
      fetchSchedules();
    } catch (error) {
      alert("Lỗi khi xóa lịch!");
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/auth/schedules/${id}/approve`);
      fetchPendingSchedules();
      fetchSchedules();
    } catch (error) {
      alert("Lỗi khi duyệt!");
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/auth/schedules/${id}/reject`);
      fetchPendingSchedules();
      fetchSchedules();
    } catch (error) {
      alert("Lỗi khi từ chối!");
    }
  };

  const groupedPendingSchedules = useMemo(() => {
    const groups = {};
    pendingSchedules.forEach(req => {
      if (!groups[req.workDate]) {
        groups[req.workDate] = [];
      }
      groups[req.workDate].push(req);
    });
    return Object.keys(groups)
      .sort((a, b) => new Date(a) - new Date(b))
      .map(date => ({
        date,
        requests: groups[date]
      }));
  }, [pendingSchedules]);

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

  // Check if a shift on a specific day is fully covered (1 Receptionist, 2 Mechanics)
  const getShiftCoverageStatus = (date, shiftId) => {
    const shiftSchedules = schedules.filter(s => 
      s.workDate === date && 
      s.shiftId === shiftId && 
      (s.status === 'SCHEDULED' || s.status === 'ASSIGNED_BY_MANAGER')
    );
    const mechanics = shiftSchedules.filter(s => s.roleName === 'MECHANIC' || s.roleName === 'ROLE_MECHANIC');
    const receptionists = shiftSchedules.filter(s => s.roleName === 'RECEPTIONIST');
    
    const isOk = mechanics.length >= 2 && receptionists.length >= 1;
    return {
      isOk,
      mechanicsCount: mechanics.length,
      receptionistsCount: receptionists.length,
      assigned: shiftSchedules
    };
  };

  const openQuickAssign = (date, shiftId) => {
    setNewSchedule({
      userId: '',
      shiftId: shiftId,
      workDate: date,
      note: ''
    });
    setIsAssignModalOpen(true);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Quản lý Ca làm việc</h1>
          <p className="text-slate-500 mt-2">Phân công và theo dõi lịch làm việc của nhân sự</p>
        </div>
        {activeTab === 'schedules' && (
          <button 
            onClick={() => setIsAssignModalOpen(true)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition flex items-center shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5 mr-2" /> Phân Công Ca
          </button>
        )}
      </div>

      <div className="flex space-x-4 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('schedules')}
          className={`pb-4 px-4 font-semibold transition ${activeTab === 'schedules' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Lịch Phân Công Tuần
        </button>
        <button
          onClick={() => setActiveTab('shifts')}
          className={`pb-4 px-4 font-semibold transition ${activeTab === 'shifts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Cấu Hình Ca Mẫu
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-4 px-4 font-semibold transition flex items-center ${activeTab === 'pending' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Duyệt Yêu Cầu 
          {pendingSchedules.length > 0 && (
            <span className="ml-2 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingSchedules.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'shifts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {editingShift ? 'Chỉnh Sửa Ca Mẫu' : 'Tạo Ca Mới'}
            </h2>
            <form onSubmit={editingShift ? handleUpdateShift : handleCreateShift} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên Ca (VD: Ca Sáng)</label>
                <input 
                  required 
                  type="text" 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-blue-500" 
                  value={editingShift ? editingShift.shiftName : newShift.shiftName} 
                  onChange={e => {
                    if (editingShift) {
                      setEditingShift({...editingShift, shiftName: e.target.value});
                    } else {
                      setNewShift({...newShift, shiftName: e.target.value});
                    }
                  }} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Giờ bắt đầu</label>
                  <input 
                    required 
                    type="time" 
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-blue-500" 
                    value={editingShift ? editingShift.startTime.slice(0,5) : newShift.startTime} 
                    onChange={e => {
                      if (editingShift) {
                        setEditingShift({...editingShift, startTime: e.target.value});
                      } else {
                        setNewShift({...newShift, startTime: e.target.value});
                      }
                    }} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Giờ kết thúc</label>
                  <input 
                    required 
                    type="time" 
                    className="w-full p-2 border border-slate-300 rounded-lg focus:outline-blue-500" 
                    value={editingShift ? editingShift.endTime.slice(0,5) : newShift.endTime} 
                    onChange={e => {
                      if (editingShift) {
                        setEditingShift({...editingShift, endTime: e.target.value});
                      } else {
                        setNewShift({...newShift, endTime: e.target.value});
                      }
                    }} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả thêm</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-blue-500" 
                  value={editingShift ? (editingShift.description || '') : newShift.description} 
                  onChange={e => {
                    if (editingShift) {
                      setEditingShift({...editingShift, description: e.target.value});
                    } else {
                      setNewShift({...newShift, description: e.target.value});
                    }
                  }} 
                />
              </div>
              <div className="flex space-x-2">
                {editingShift && (
                  <button 
                    type="button" 
                    onClick={() => setEditingShift(null)} 
                    className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
                  >
                    Hủy
                  </button>
                )}
                <button 
                  type="submit" 
                  className={`py-2.5 text-white rounded-lg font-medium flex items-center justify-center transition ${editingShift ? 'w-2/3 bg-emerald-600 hover:bg-emerald-700' : 'w-full bg-blue-600 hover:bg-blue-700'}`}
                >
                  {editingShift ? 'Cập nhật Ca' : 'Tạo Ca Mẫu'}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {shifts.map(shift => (
              <div key={shift.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col hover:border-blue-200 transition relative group">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-slate-800">{shift.shiftName}</h3>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={() => setEditingShift(shift)}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteShift(shift.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                      title="Xóa ca"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-700 mb-2">
                  {shift.startTime.slice(0,5)} - {shift.endTime.slice(0,5)}
                </div>
                <p className="text-sm text-slate-500">{shift.description || 'Không có mô tả'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'schedules' && (
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
            <div className="text-xs text-slate-500 italic bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded-lg">
              💡 Định mức chuẩn/ca: 1 Lễ tân & 2 Thợ máy. Đủ chỉ tiêu = màu Xanh, thiếu = màu Đỏ.
            </div>
          </div>

          {/* Weekly Matrix Grid (7 Columns) */}
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
                    const status = getShiftCoverageStatus(day.date, shift.id);
                    return (
                      <div 
                        key={shift.id} 
                        className={`p-3 rounded-lg border flex flex-col transition relative group ${
                          status.isOk ? 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-400' : 'bg-rose-50/70 border-rose-200 hover:border-rose-400'
                        }`}
                      >
                        {/* Shift Title */}
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-slate-800 uppercase">{shift.shiftName}</span>
                          <span className="text-[10px] text-slate-500 font-semibold bg-white px-1.5 py-0.5 rounded border">
                            {shift.startTime.slice(0,5)}-{shift.endTime.slice(0,5)}
                          </span>
                        </div>

                        {/* Quota Indicators */}
                        <div className="flex justify-between text-[10px] text-slate-500 mb-2 border-b border-dashed pb-1">
                          <span className={status.receptionistsCount >= 1 ? 'text-emerald-700' : 'text-rose-600 font-bold'}>
                            Lễ tân: {status.receptionistsCount}/1
                          </span>
                          <span className={status.mechanicsCount >= 2 ? 'text-emerald-700' : 'text-rose-600 font-bold'}>
                            Thợ: {status.mechanicsCount}/2
                          </span>
                        </div>

                        {/* Assigned Employees */}
                        <div className="space-y-1.5 flex-1 min-h-[40px]">
                          {status.assigned.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic block mt-1">Trống ca</span>
                          ) : (
                            status.assigned.map(emp => (
                              <div key={emp.id} className="flex justify-between items-center bg-white px-2 py-1 rounded shadow-xs text-xs border border-slate-100 group/item hover:border-blue-400 transition">
                                <div className="truncate pr-1">
                                  <div className="font-semibold text-slate-700 truncate">{emp.fullName}</div>
                                  <div className="text-[9px] text-slate-400 uppercase tracking-wider">
                                    {emp.roleName === 'MECHANIC' || emp.roleName === 'ROLE_MECHANIC' ? 'Thợ' : 'Lễ tân'}
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleDeleteSchedule(emp.id)} 
                                  className="text-slate-400 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition p-0.5 rounded hover:bg-slate-100"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Quick Add Button */}
                        <button 
                          onClick={() => openQuickAssign(day.date, shift.id)}
                          className="mt-2 w-full py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded text-[10px] font-semibold flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1 text-slate-500" /> Thêm người
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="font-bold text-xl text-slate-800">Yêu Cầu Đăng Ký Chờ Duyệt</h2>
              <p className="text-sm text-slate-500 mt-1">
                Hiện đang có <span className="font-bold text-rose-500">{pendingSchedules.length}</span> yêu cầu chờ xử lý
              </p>
            </div>
          </div>
          
          {pendingSchedules.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">Tuyệt vời!</h3>
              <p>Mọi yêu cầu đăng ký lịch đã được xử lý xong.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedPendingSchedules.map(group => (
                <div key={group.date} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300 slide-in-from-bottom-2">
                  <div className="bg-slate-50/80 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-blue-500 mr-2.5" />
                      <h3 className="font-bold text-slate-800 text-lg">
                        Ngày {group.date.split('-').reverse().join('/')}
                      </h3>
                      <span className="ml-3 bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md">
                        {group.requests.length} yêu cầu
                      </span>
                    </div>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {group.requests.map(req => (
                      <div key={req.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200 bg-white flex flex-col justify-between group">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center font-bold text-lg mr-3 shadow-sm border border-blue-200/50 group-hover:scale-105 transition-transform">
                              {req.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 text-base">{req.fullName}</div>
                              <div className="text-[11px] font-semibold text-slate-500 mt-0.5 uppercase tracking-wider bg-slate-100 inline-block px-1.5 py-0.5 rounded">
                                {req.roleName === 'MECHANIC' || req.roleName === 'ROLE_MECHANIC' ? 'Thợ máy' : 'Lễ tân'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 p-3.5 rounded-lg mb-5 border border-slate-100">
                          <div className="flex items-center text-sm font-semibold text-slate-700">
                            <Clock className="w-4 h-4 mr-2 text-slate-400" />
                            {req.shiftName}
                          </div>
                          {req.note && (
                            <div className="text-xs text-slate-500 mt-2.5 italic border-t border-slate-200 pt-2.5 relative">
                              <span className="text-slate-300 absolute -top-1.5 bg-slate-50 px-1 font-serif text-lg">"</span>
                              <span className="ml-2">{req.note}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-3 mt-auto">
                          <button 
                            onClick={() => handleReject(req.id)} 
                            className="flex-1 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-lg font-bold transition text-sm flex justify-center items-center"
                          >
                            <X className="w-4 h-4 mr-1.5" /> Từ chối
                          </button>
                          <button 
                            onClick={() => handleApprove(req.id)} 
                            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition shadow-md shadow-emerald-500/20 text-sm flex justify-center items-center"
                          >
                            <CheckCircle className="w-4 h-4 mr-1.5" /> Duyệt
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modern Overlay Modal for Scheduling */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 transition-all">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Phân Công Ca Làm</h3>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAssignSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày làm việc</label>
                <input 
                  required 
                  type="date" 
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-blue-500 text-sm" 
                  value={newSchedule.workDate} 
                  onChange={e => setNewSchedule({...newSchedule, workDate: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ca làm việc</label>
                <select 
                  required 
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-blue-500 text-sm" 
                  value={newSchedule.shiftId} 
                  onChange={e => setNewSchedule({...newSchedule, shiftId: e.target.value})}
                >
                  <option value="">-- Chọn ca --</option>
                  {shifts.map(s => <option key={s.id} value={s.id}>{s.shiftName} ({s.startTime.slice(0,5)} - {s.endTime.slice(0,5)})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chọn Nhân viên</label>
                <select 
                  required 
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-blue-500 text-sm" 
                  value={newSchedule.userId} 
                  onChange={e => setNewSchedule({...newSchedule, userId: e.target.value})}
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName} - {u.role === 'MECHANIC' || u.role === 'ROLE_MECHANIC' ? 'Thợ máy' : 'Lễ tân'}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú (Không bắt buộc)</label>
                <input 
                  type="text" 
                  placeholder="Nhập ghi chú ca làm..." 
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-blue-500 text-sm" 
                  value={newSchedule.note || ''} 
                  onChange={e => setNewSchedule({...newSchedule, note: e.target.value})} 
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsAssignModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center shadow-lg shadow-blue-500/10"
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Lưu Phân Công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
