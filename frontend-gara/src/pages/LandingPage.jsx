import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Wrench, Clock, ShieldCheck, ChevronRight, Phone } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <Car className="h-8 w-8 text-blue-700" />
              <span className="font-bold text-2xl text-blue-900 tracking-tight">AutoFlow Pro</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-blue-700 font-medium hidden sm:block transition-colors"
              >
                Kênh Nhân Viên
              </button>
              <button 
                onClick={() => navigate('/customer/login')}
                className="bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium hover:bg-blue-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                Khách Hàng Đăng Nhập <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-blue-900 overflow-hidden">
        {/* Abstract Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon fill="currentColor" points="0,100 100,0 100,100" />
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="py-20 md:py-32 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2 text-center md:text-left text-white">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                Chăm sóc xế yêu <br/>
                <span className="text-blue-300">Nhanh chóng & Minh bạch</span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-lg mx-auto md:mx-0 leading-relaxed">
                Hệ thống Gara chuyên nghiệp giúp bạn theo dõi tiến độ sửa chữa theo thời gian thực. An tâm trao gửi niềm tin.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button 
                  onClick={() => navigate('/customer/login')}
                  className="bg-white text-blue-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:-translate-y-1"
                >
                  Đặt lịch & Theo dõi ngay
                </button>
                <button 
                  className="border-2 border-blue-400 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-800 hover:border-blue-300 transition-all"
                >
                  Tải Ứng Dụng
                </button>
              </div>
            </div>
            
            <div className="md:w-1/2">
              {/* Illustration mockup (using a stylized div instead of image to ensure it loads) */}
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl shadow-2xl p-2 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="bg-white rounded-xl overflow-hidden aspect-video flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-slate-100 flex flex-col">
                    <div className="h-12 border-b bg-white flex items-center px-4">
                      <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400 mr-2"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-center items-center text-center">
                      <ShieldCheck className="h-16 w-16 text-green-500 mb-4" />
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Tiến độ xe: Đang kiểm tra</h3>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-4 max-w-xs">
                        <div className="bg-green-500 h-3 rounded-full w-1/3"></div>
                      </div>
                      <p className="text-gray-500">Kỹ thuật viên Nguyễn Văn A đang kiểm tra động cơ.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Dịch vụ chuẩn 5 sao</h2>
            <p className="mt-4 text-xl text-gray-500">Trải nghiệm chăm sóc xe hoàn toàn mới trong kỷ nguyên số.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition-shadow border border-slate-100">
              <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Wrench className="h-7 w-7 text-blue-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Đội ngũ chuyên nghiệp</h3>
              <p className="text-gray-600 leading-relaxed">
                Kỹ thuật viên được đào tạo bài bản, sử dụng máy móc chẩn đoán hiện đại nhất để bắt đúng bệnh.
              </p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition-shadow border border-slate-100">
              <div className="bg-green-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Clock className="h-7 w-7 text-green-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Theo dõi Real-time</h3>
              <p className="text-gray-600 leading-relaxed">
                Cập nhật tiến độ từng giây qua hệ thống Customer Portal. Bạn không cần phải gọi điện hỏi thăm.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition-shadow border border-slate-100">
              <div className="bg-amber-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Phone className="h-7 w-7 text-amber-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Đặt lịch 1 chạm</h3>
              <p className="text-gray-600 leading-relaxed">
                Đăng nhập bằng số điện thoại, chọn giờ rảnh rỗi và đem xe đến ngay mà không cần chờ đợi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-blue-900 mb-6">Bạn đã sẵn sàng trải nghiệm?</h2>
          <button 
            onClick={() => navigate('/customer/login')}
            className="bg-blue-700 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-800 transition-colors shadow-lg"
          >
            Đăng nhập ngay với SĐT
          </button>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 text-center">
        <p>© 2026 AutoFlow Pro - Gara Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}
