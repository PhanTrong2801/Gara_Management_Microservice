import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../../firebase";
import api from "../../api/axiosConfig";

export default function CustomerLogin() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Xóa reCAPTCHA cũ (nếu có) để tránh lỗi "element has been removed" do React re-render DOM
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
            } catch (e) {
                // Ignore clear errors
            }
            window.recaptchaVerifier = null;
        }

        // Khởi tạo lại reCAPTCHA mới gắn với thẻ div hiện tại
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => {
                // reCAPTCHA solved
            }
        });
    }, []);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Định dạng SĐT chuẩn quốc tế, vd: +84987654321
            let formattedPhone = phoneNumber;
            if (formattedPhone.startsWith("0")) {
                formattedPhone = "+84" + formattedPhone.slice(1);
            } else if (!formattedPhone.startsWith("+")) {
                formattedPhone = "+" + formattedPhone;
            }

            const appVerifier = window.recaptchaVerifier;
            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            window.confirmationResult = confirmationResult;
            setIsOtpSent(true);
            setLoading(false);
        } catch (err) {
            console.error("Lỗi gửi OTP:", err);
            setError("Không thể gửi mã OTP. Vui lòng kiểm tra lại số điện thoại.");
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await window.confirmationResult.confirm(otp);
            const user = result.user;
            // Lấy ID Token từ Firebase
            const idToken = await user.getIdToken();

            // Gửi Token lên Backend của chúng ta
            const response = await api.post('/auth/login-phone', { idToken });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', response.data.role);
            localStorage.setItem('username', response.data.username);

            try {
                const payload = JSON.parse(atob(response.data.token.split('.')[1]));
                if (payload.userId) {
                    localStorage.setItem('userId', payload.userId);
                }
            } catch (e) {
                console.error("Không thể giải mã token", e);
            }

            // Đăng nhập thành công, chuyển hướng vào portal
            navigate('/customer');
        } catch (err) {
            console.error("Lỗi xác thực OTP chi tiết:", err.response?.data || err.message || err);
            setError(`Mã OTP không hợp lệ hoặc lỗi Server: ${err.response?.data || ''}`);
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-slate-100">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-blue-900">Gara Khách Hàng</h1>
                    <p className="text-gray-500 mt-2">Đăng nhập để theo dõi xe của bạn</p>
                </div>
                
                {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-100 rounded">{error}</div>}

                {!isOtpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                            <input 
                                type="tel" required
                                placeholder="Ví dụ: 0987654321"
                                className="w-full px-4 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                        </div>
                        <button type="submit" disabled={loading} className="w-full px-4 py-2 text-white bg-blue-900 rounded-md hover:bg-blue-800 transition-colors font-medium disabled:opacity-50">
                            {loading ? "Đang xử lý..." : "Nhận mã OTP"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mã xác thực (OTP)</label>
                            <input 
                                type="text" required
                                placeholder="Nhập mã 6 số"
                                className="w-full px-4 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500 tracking-widest text-center text-lg"
                                value={otp} onChange={(e) => setOtp(e.target.value)}
                            />
                        </div>
                        <button type="submit" disabled={loading} className="w-full px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors font-medium disabled:opacity-50">
                            {loading ? "Đang xác thực..." : "Đăng nhập"}
                        </button>
                        <button type="button" onClick={() => setIsOtpSent(false)} className="w-full text-sm text-gray-500 hover:text-blue-600 mt-2">
                            Quay lại nhập số khác
                        </button>
                    </form>
                )}

                <div id="recaptcha-container"></div>
            </div>
        </div>
    );
}
