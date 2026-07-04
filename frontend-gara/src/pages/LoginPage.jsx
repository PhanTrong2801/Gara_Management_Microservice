import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from '../api/axiosConfig';

export default function LoginPage(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) =>{
        e.preventDefault();
        try{
            const response = await api.post('/auth/login', {username, password});

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', response.data.role);
            localStorage.setItem('username', response.data.username);

            // Trích xuất userId từ token và lưu lại
            try {
                const payload = JSON.parse(atob(response.data.token.split('.')[1]));
                if (payload.userId) {
                    localStorage.setItem('userId', payload.userId);
                }
            } catch (e) {
                console.error("Không thể giải mã token", e);
            }
            
            if (response.data.role === 'CUSTOMER' || response.data.role === 'ROLE_CUSTOMER') {
                navigate('/customer');
            } else {
                navigate('/dashboard');
            }
        }catch(err){
            setError('Đăng nhập thất bại');
        }
    };

    return (
    <div className="flex items-center justify-center h-screen bg-slate-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-900">AutoFlow Pro</h1>
          <p className="text-gray-500 mt-2">Hệ thống quản lý Gara</p>
        </div>
        
        {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-100 rounded">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tài khoản</label>
            <input 
              type="text" required
              className="w-full px-4 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={username} onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
            <input 
              type="password" required
              className="w-full px-4 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full px-4 py-2 text-white bg-blue-900 rounded-md hover:bg-blue-800 transition-colors font-medium">
            Đăng nhập hệ thống
          </button>
        </form>
      </div>
    </div>
  );


}