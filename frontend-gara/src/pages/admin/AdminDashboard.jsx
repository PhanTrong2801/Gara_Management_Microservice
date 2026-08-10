import { useState, useEffect } from 'react';
import { Users, Activity, DollarSign, Package, ArrowUpRight, ArrowDownRight, Edit2, X, UserPlus, Settings, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../api/axiosConfig';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', fullName: '', roleName: 'RECEPTIONIST' });
  const [createError, setCreateError] = useState('');
  
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [loyaltySettings, setLoyaltySettings] = useState({
    vndPerPoint: 100000,
    silverThreshold: 100,
    goldThreshold: 500,
    platinumThreshold: 2000
  });

  const currentUserRole = localStorage.getItem('role')?.toUpperCase() || '';
  const isAdmin = currentUserRole === 'ROLE_ADMIN' || currentUserRole === 'ADMIN';

  const [dashboardStats, setDashboardStats] = useState({
    totalRevenue: 0,
    totalRepairs: 0,
    lowStockItems: 0,
    monthlyRevenues: [],
    repairStatus: []
  });

  const [lowStockParts, setLowStockParts] = useState([]);
  const COLORS = ['#f59e0b', '#3b82f6', '#10b981']; // Pending (Yellow), Repairing (Blue), Completed (Green)

  const stats = [
    { title: 'Tổng Doanh Thu', value: `${dashboardStats.totalRevenue.toLocaleString()} ₫`, change: 'Thực tế', isIncrease: true, icon: <DollarSign className="w-6 h-6 text-emerald-500" /> },
    { title: 'Tổng Người Dùng', value: users.length.toString(), change: 'Thực tế', isIncrease: true, icon: <Users className="w-6 h-6 text-blue-500" /> },
    { title: 'Đơn Sửa Chữa', value: dashboardStats.totalRepairs.toString(), change: 'Thực tế', isIncrease: true, icon: <Activity className="w-6 h-6 text-purple-500" /> },
    { title: 'Cảnh Báo Kho (Dưới 10)', value: dashboardStats.lowStockItems.toString(), change: 'Thực tế', isIncrease: false, icon: <Package className="w-6 h-6 text-rose-500" /> }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch all required data in parallel using new Stats APIs
      const [usersRes, billingStatsRes, repairStatsRes, lowStockRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/billing/invoices/stats'),
        api.get('/repair/orders/stats'),
        api.get('/inventory/parts/low-stock?size=5')
      ]);

      const usersData = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.content || []);
      setUsers(usersData);

      const bStats = billingStatsRes.data;
      const rStats = repairStatsRes.data;
      const lowStockData = lowStockRes.data.content || lowStockRes.data || [];
      
      setLowStockParts(lowStockData);

      setDashboardStats({
        totalRevenue: bStats.totalRevenue || 0,
        totalRepairs: rStats.totalOrders || 0,
        lowStockItems: lowStockRes.data.totalElements || lowStockData.length,
        monthlyRevenues: bStats.monthlyRevenues || [],
        repairStatus: [
          { name: 'Chờ sửa', value: rStats.pendingCount || 0 },
          { name: 'Đang sửa', value: rStats.repairingCount || 0 },
          { name: 'Hoàn thành', value: rStats.completedCount || 0 }
        ]
      });
      
    } catch (err) {
      setError('Lỗi tải dữ liệu bảng điều khiển');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      const usersData = Array.isArray(response.data) ? response.data : (response.data?.content || []);
      setUsers(usersData);
    } catch (err) {
      console.error(err);
    }
  };



  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/auth/users/${editingUser.id}`, editingUser);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert("Cập nhật thất bại!");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    try {
      await api.post('/auth/register', newUser);
      setShowCreateModal(false);
      setNewUser({ username: '', password: '', fullName: '', roleName: 'RECEPTIONIST' });
      fetchUsers();
    } catch (err) {
      setCreateError(err.response?.data || 'Tạo tài khoản thất bại!');
    }
  };

  const openLoyaltyModal = async () => {
    try {
      const res = await api.get('/customers/loyalty-settings');
      if (res.data) setLoyaltySettings(res.data);
    } catch (err) {
      console.error("Lỗi lấy cấu hình:", err);
    }
    setShowLoyaltyModal(true);
  };

  const handleSaveLoyaltySettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/customers/loyalty-settings', loyaltySettings);
      setShowLoyaltyModal(false);
      alert('Cập nhật cấu hình thành công!');
    } catch (err) {
      alert('Lỗi khi lưu cấu hình');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tổng Quan Quản Trị</h2>
          <p className="text-sm text-gray-500 mt-1">Dành riêng cho Quản lý và Giám đốc hệ thống</p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <button onClick={openLoyaltyModal} className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 font-medium rounded-lg shadow-sm hover:bg-purple-100 transition-colors">
              <Settings className="w-4 h-4" /> Cấu hình Điểm & Hạng
            </button>
          )}
          <button onClick={() => window.location.href = '/dashboard/suppliers'} className="px-4 py-2 bg-emerald-50 text-emerald-600 font-medium rounded-lg shadow-sm hover:bg-emerald-100 transition-colors">
            Nhà cung cấp & Nhập hàng
          </button>
          {/* <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition-colors">
            Xuất Báo Cáo
          </button> */}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-2">{stat.value}</h3>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                {stat.icon}
              </div>
            </div>
            
            <div className="relative z-10 mt-4 flex items-center text-sm">
              <span className={`flex items-center font-medium ${stat.isIncrease ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stat.isIncrease ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                {stat.change}
              </span>
              <span className="text-gray-400 ml-2">so với tháng trước</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Doanh Thu 6 Tháng Gần Nhất</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardStats.monthlyRevenues}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `${value / 1000000}M`} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} formatter={(value) => [`${value.toLocaleString()} ₫`, 'Doanh thu']} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2 w-full text-left">Trạng Thái Sửa Chữa</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardStats.repairStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dashboardStats.repairStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Management Table */}
        <div className="lg:col-span-2 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">Quản Lý Người Dùng</h3>
            {isAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg shadow hover:bg-emerald-700 transition-colors text-sm"
              >
                <UserPlus className="w-4 h-4" /> Thêm tài khoản
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <p className="text-center py-4 text-gray-500">Đang tải...</p>
            ) : error ? (
              <p className="text-center py-4 text-rose-500">{error}</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-sm font-semibold text-gray-500">Người dùng</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500">SĐT</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500">Vai trò</th>
                    <th className="pb-3 text-sm font-semibold text-gray-500">Trạng thái</th>
                    {isAdmin && <th className="pb-3 text-sm font-semibold text-gray-500 text-center">Hành động</th>}
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-3 uppercase">
                            {user.fullName ? user.fullName.charAt(0) : user.username.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{user.fullName || user.username}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-600">{user.phone || 'Chưa cập nhật'}</td>
                      <td className="py-4 text-sm text-gray-600">{user.role}</td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {user.active ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-4 text-center">
                          <button 
                            onClick={() => setEditingUser(user)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* System Alerts & Low Stock */}
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-bold text-rose-600 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Cảnh Báo Phụ Tùng
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {lowStockParts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Không có phụ tùng nào sắp hết.</p>
            ) : (
              lowStockParts.map(part => (
                <div key={part.id} className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-rose-800 text-sm truncate pr-2">{part.name}</p>
                    <span className="px-2 py-0.5 bg-rose-200 text-rose-800 text-xs font-bold rounded">
                      Còn {part.stockQuantity}
                    </span>
                  </div>
                  <p className="text-xs text-rose-600">Mã: {part.partCode} • Tối thiểu: {part.minStockLevel}</p>
                </div>
              ))
            )}
          </div>
          
          <button onClick={() => window.location.href = '/dashboard/suppliers'} className="mt-4 w-full py-2 bg-rose-100 text-rose-700 font-semibold rounded-lg hover:bg-rose-200 transition-colors text-sm">
            Tạo Đơn Nhập Hàng
          </button>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">Chỉnh sửa người dùng</h3>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tài khoản</label>
                <input type="text" value={editingUser.username} disabled className="w-full p-2 border rounded bg-gray-50 text-gray-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò (Role)</label>
                <select 
                  className="w-full p-2 border rounded focus:ring focus:ring-blue-200"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                >
                  <option value="ROLE_ADMIN">Admin</option>
                  <option value="ROLE_MANAGER">Manager</option>
                  <option value="ROLE_USER">User</option>
                </select>
              </div>

              <div className="flex items-center mt-4">
                <input 
                  type="checkbox" 
                  id="activeStatus"
                  checked={editingUser.active}
                  onChange={(e) => setEditingUser({...editingUser, active: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="activeStatus" className="ml-2 text-sm font-medium text-gray-700">Tài khoản đang hoạt động</label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">Thêm tài khoản mới</h3>
              <button onClick={() => { setShowCreateModal(false); setCreateError(''); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg">{createError}</div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <input 
                  type="text" required
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                  className="w-full p-2 border rounded focus:ring focus:ring-blue-200"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                <input 
                  type="text" required
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full p-2 border rounded focus:ring focus:ring-blue-200"
                  placeholder="nguyenvana"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <input 
                  type="password" required
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full p-2 border rounded focus:ring focus:ring-blue-200"
                  placeholder="••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                <select 
                  className="w-full p-2 border rounded focus:ring focus:ring-blue-200"
                  value={newUser.roleName}
                  onChange={(e) => setNewUser({...newUser, roleName: e.target.value})}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="RECEPTIONIST">Lễ tân</option>
                  <option value="MECHANIC">Thợ kỹ thuật</option>
                  <option value="CUSTOMER">Khách hàng</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => { setShowCreateModal(false); setCreateError(''); }} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loyalty Settings Modal */}
      {showLoyaltyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold">Cấu hình Tích điểm & Hạng thẻ</h3>
              <button onClick={() => setShowLoyaltyModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveLoyaltySettings} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tỷ lệ quy đổi điểm (VNĐ)</label>
                <p className="text-xs text-gray-500 mb-2">Số tiền khách cần chi tiêu để nhận được 1 điểm</p>
                <input 
                  type="number" required
                  value={loyaltySettings.vndPerPoint}
                  onChange={(e) => setLoyaltySettings({...loyaltySettings, vndPerPoint: Number(e.target.value)})}
                  className="w-full p-2 border rounded focus:ring focus:ring-purple-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mốc thăng hạng BẠC (Điểm)</label>
                <input 
                  type="number" required
                  value={loyaltySettings.silverThreshold}
                  onChange={(e) => setLoyaltySettings({...loyaltySettings, silverThreshold: Number(e.target.value)})}
                  className="w-full p-2 border rounded focus:ring focus:ring-purple-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mốc thăng hạng VÀNG (Điểm)</label>
                <input 
                  type="number" required
                  value={loyaltySettings.goldThreshold}
                  onChange={(e) => setLoyaltySettings({...loyaltySettings, goldThreshold: Number(e.target.value)})}
                  className="w-full p-2 border rounded focus:ring focus:ring-purple-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mốc thăng hạng BẠCH KIM (Điểm)</label>
                <input 
                  type="number" required
                  value={loyaltySettings.platinumThreshold}
                  onChange={(e) => setLoyaltySettings({...loyaltySettings, platinumThreshold: Number(e.target.value)})}
                  className="w-full p-2 border rounded focus:ring focus:ring-purple-200"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setShowLoyaltyModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
                  Lưu cài đặt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
