import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../style/LoginPage.scss';

const LoginPage = () => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState(0); // 0 for Login, 1 for Register
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('member');

  // State and errors for login form
  const [loginData, setLoginData] = useState({ emailOrUsername: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({ emailOrUsername: '', password: '' });

  // State and errors for register form (kept for consistency, though Register.jsx will handle actual registration)
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: ''
  });
  const [registerErrors, setRegisterErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: ''
  });

  const navigate = useNavigate();

  // Email validation regex
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Phone number validation regex
  const validatePhoneNumber = (phone) => {
    const re = /^[0-9]{10}$/;
    return re.test(phone);
  };

  // Login form validation
  const validateLoginForm = () => {
    const errors = {};
    if (!loginData.emailOrUsername) {
      errors.emailOrUsername = 'Vui lòng nhập email hoặc tên đăng nhập!';
    }
    if (!loginData.password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    }
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Register form validation (for client-side check, actual registration handled by Register.jsx)
  const validateRegisterForm = () => {
    const errors = {};
    if (!registerData.username) {
      errors.username = 'Vui lòng nhập tên đăng nhập';
    }
    if (!registerData.email) {
      errors.email = 'Vui lòng nhập email';
    } else if (!validateEmail(registerData.email)) {
      errors.email = 'Email không hợp lệ';
    }
    if (!registerData.phoneNumber) {
      errors.phoneNumber = 'Vui lòng nhập số điện thoại!';
    } else if (!validatePhoneNumber(registerData.phoneNumber)) {
      errors.phoneNumber = 'Số điện thoại phải có 10 chữ số';
    }
    if (!registerData.address) {
      errors.address = 'Vui lòng nhập địa chỉ';
    }
    if (!registerData.password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (registerData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (!registerData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu không khớp';
    }
    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle tab change
  const handleTabChange = (index) => {
    setActiveTab(index);
    setError('');
    setLoginErrors({});
    setRegisterErrors({});
  };

  // Handle login input change
  const handleLoginInputChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    setLoginErrors({ ...loginErrors, [e.target.name]: '' });
  };

  // Handle register input change
  const handleRegisterInputChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    setRegisterErrors({ ...registerErrors, [e.target.name]: '' });
  };

  // Handle login form submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setLoading(true);
    setError('');
    try {
      localStorage.clear();
      const endpoint = 'http://localhost:5000/api/auth/login';
      const loginPayload = {
        emailOrUsername: loginData.emailOrUsername,
        password: loginData.password
      };

      const response = await axios.post(endpoint, loginPayload);
      const { token, user } = response.data;

      if (
        (userType === 'member' && user.role !== 'member' && user.role !== 'guest' && user.role !== 'user') ||
        (userType === 'coach' && user.role !== 'coach') ||
        (userType === 'admin' && user.role !== 'admin')
      ) {
        setError('Tài khoản không đúng loại bạn đã chọn!');
        setLoading(false);
        return;
      }

      login(user, token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      if (user.role === 'coach') {
        navigate('/coach-portal');
      } else if (user.role === 'admin') {
        navigate('/admin/users');
      } else {
        navigate('/');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // handleRegisterSubmit function in LoginPage is primarily for validation, actual registration handled by Register.jsx
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;

    setLoading(true);
    setError('');
    try {
      // For actual registration, user is redirected to Register.jsx
      // This part here is mainly for showing loading/error states in LoginPage's register tab
      // In a real scenario, you'd make an API call from Register.jsx
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setError('Đăng ký không được thực hiện từ trang này. Vui lòng sử dụng trang Đăng ký riêng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper d-flex align-items-center justify-content-center min-vh-100">
      <div className="auth-container card shadow-lg rounded-lg overflow-hidden row no-gutters">
        <div className="auth-image-half d-none d-md-block col-md-6">
          <div className="image-overlay d-flex flex-column justify-content-center align-items-center text-white p-4">
            <h2 className="mb-3 text-center">Chào mừng đến với hệ thống hỗ trợ cai thuốc</h2>
            <p className="text-center">Hãy cùng chúng tôi bắt đầu hành trình sống khỏe mạnh!</p>
          </div>
        </div>
        <div className="auth-form-half col-md-6 p-4 d-flex flex-column justify-content-center">
          <div className="d-flex justify-content-between mb-4">
            <button
              className={`btn btn-lg w-50 ${activeTab === 0 ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => handleTabChange(0)}
            >
              Đăng nhập
            </button>
            <button
              className={`btn btn-lg w-50 ${activeTab === 1 ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => navigate('/register')} // Redirect to dedicated Register page
            >
              Đăng ký
            </button>
          </div>

          {error && (
            <div className="alert alert-danger mb-3" role="alert">
              {error}
            </div>
          )}

          {/* Login Form */}
          {activeTab === 0 && (
            <form onSubmit={handleLoginSubmit}>
              <div className="mb-3">
                <label htmlFor="userType" className="form-label">Loại tài khoản</label>
                <select
                  className="form-select"
                  id="userType"
                  name="userType"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                >
                  <option value="member">Thành viên</option>
                  <option value="coach">Huấn luyện viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="loginEmailOrUsername" className="form-label">Email hoặc Tên đăng nhập</label>
                <input
                  type="text"
                  className={`form-control ${loginErrors.emailOrUsername ? 'is-invalid' : ''}`}
                  id="loginEmailOrUsername"
                  name="emailOrUsername"
                  placeholder="Nhập email hoặc tên đăng nhập"
                  value={loginData.emailOrUsername}
                  onChange={handleLoginInputChange}
                  required
                />
                {loginErrors.emailOrUsername && <div className="invalid-feedback">{loginErrors.emailOrUsername}</div>}
              </div>

              <div className="mb-4">
                <label htmlFor="loginPassword" className="form-label">Mật khẩu</label>
                <input
                  type="password"
                  className={`form-control ${loginErrors.password ? 'is-invalid' : ''}`}
                  id="loginPassword"
                  name="password"
                  placeholder="Nhập mật khẩu"
                  value={loginData.password}
                  onChange={handleLoginInputChange}
                  required
                />
                {loginErrors.password && <div className="invalid-feedback">{loginErrors.password}</div>}
              </div>

              <button
                type="submit"
                className="btn btn-success w-100 py-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  'Đăng nhập'
                )}
              </button>

              <div className="text-center mt-3">
                <Link to="#" className="text-success text-decoration-none">Quên mật khẩu?</Link>
              </div>
            </form>
          )}

          {/* Register Form (Placeholder, actual registration handled by Register.jsx) */}
          {activeTab === 1 && (
            <div className="text-center">
              <p>Vui lòng chuyển đến trang Đăng ký để tạo tài khoản mới.</p>
              <button
                className="btn btn-success mt-3"
                onClick={() => navigate('/register')}
              >
                Đi đến trang Đăng ký
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 
