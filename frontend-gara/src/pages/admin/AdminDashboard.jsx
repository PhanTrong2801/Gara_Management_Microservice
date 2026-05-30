import { useState, useEffect } from 'react';
import { Users, Activity, DollarSign, Package, ArrowUpRight, ArrowDownRight, Edit2, X, UserPlus } from 'lucide-react';
import api from '../../api/axiosConfig';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', fullName: '', roleName: 'RECEPTIONIST' });
  const [createError, setCreateError] = useState('');
  
  const currentUserRole = localStorage.getItem('role')?.toUpperCase() || '';
  const isAdmin = currentUserRole === 'ROLE_ADMIN' || currentUserRole === 'ADMIN';

  const stats = [
    { title: 'Tổng Doanh Thu', value: '1,240,000,000 ₫', change: '+12.5%', isIncrease: true, icon: <DollarSign className="w-6 h-6 text-emerald-500" /> },
    { title: 'Tổng Người Dùng', value: users.length.toString(), change: '+2', isIncrease: true, icon: <Users className="w-6 h-6 text-blue-500" /> },
    { title: 'Đơn Sửa Chữa', value: '430', change: '-4.1%', isIncrease: false, icon: <Activity className="w-6 h-6 text-purple-500" /> },
    { title: 'Cảnh Báo Kho', value: '12', change: '+2', isIncrease: false, icon: <Package className="w-6 h-6 text-rose-500" /> }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/users');
      setUsers(response.data);
    } catch (err) {
      setError('Lỗi tải danh sách người dùng');
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Tổng Quan Quản Trị</h2>
          <p className="text-sm text-gray-500 mt-1">Dành riêng cho Quản lý và Giám đốc hệ thống</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition-colors">
          Xuất Báo Cáo
        </button>
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

        {/* System Activity */}
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Hoạt Động Hệ Thống</h3>
          <div className="space-y-6">
            <div className="relative pl-4 border-l-2 border-blue-200">
              <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1"></div>
              <p className="text-sm font-medium text-gray-800">Sao lưu dữ liệu tự động</p>
              <p className="text-xs text-gray-500 mt-1">Hôm nay, 02:00 AM</p>
            </div>
            
            <div className="relative pl-4 border-l-2 border-emerald-200">
              <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px] top-1"></div>
              <p className="text-sm font-medium text-gray-800">Cập nhật giá phụ tùng</p>
              <p className="text-xs text-gray-500 mt-1">Hôm qua, 15:30 PM</p>
            </div>
          </div>
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
    </div>
  );
}
