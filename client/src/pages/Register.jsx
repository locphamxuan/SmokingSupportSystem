import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css"; 
import "../style/Register.scss"; 
import { useNavigate, Link } from "react-router-dom";
import axios from 'axios';

function Register() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(1); // 1 for Register, 0 for Login
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State for form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: ''
  });

  // State for form errors
  const [formErrors, setFormErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: ''
  });

  // Validation functions
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhoneNumber = (phone) => {
    const re = /^[0-9]{10}$/;
    return re.test(phone);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username) {
      errors.username = 'Vui lòng nhập tên đăng nhập';
    }
    
    if (!formData.email) {
      errors.email = 'Vui lòng nhập email';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }
    
    if (!formData.password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu không khớp';
    }
    
    if (!formData.phoneNumber) {
      errors.phoneNumber = 'Vui lòng nhập số điện thoại';
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      errors.phoneNumber = 'Số điện thoại phải có 10 chữ số';
    }
    
    if (!formData.address) {
      errors.address = 'Vui lòng nhập địa chỉ';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle tab change
  const handleTabChange = (index) => {
    if (index === 0) {
      navigate('/login');
      return;
    }
    setActiveTab(index);
    setError('');
    setSuccess('');
    setFormErrors({});
  };

  // Handle input change
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormErrors({ ...formErrors, [e.target.name]: '' });
    setError('');
    setSuccess('');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const registerPayload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        address: formData.address
      };

      const response = await axios.post('http://localhost:5000/api/auth/register', registerPayload);
      
      if (response.status === 201) {
        // Đảm bảo user data có đúng format nếu API trả về user data
        if (response.data.user) {
          const normalizedUser = {
            ...response.data.user,
            isMemberVip: response.data.user.isMemberVip || false,
            role: response.data.user.role || 'member'
          };
          // Lưu user data nếu có token
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(normalizedUser));
          }
        }
        
        setSuccess("Bạn đã đăng ký thành công! Đang chuyển về trang đăng nhập...");
        // Delay để user có thể đọc thông báo
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Register error:', error);
      if (error.response) {
        // Server responded with error status
        setError(error.response.data.message || 'Đăng ký thất bại. Vui lòng thử lại!');
      } else if (error.request) {
        // Network error
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!');
      } else {
        // Other error
        setError('Đăng ký thất bại. Vui lòng thử lại!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-auth-wrapper">
      <div className="auth-form-container register-container">
        {/* User Avatar */}
        <div className="user-avatar">
          <div className="avatar-circle">
            <i className="fas fa-user-plus"></i>
          </div>
          <div className="status-indicator"></div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 0 ? 'active' : ''}`}
            onClick={() => handleTabChange(0)}
          >
            Đăng nhập
          </button>
          <button
            className={`tab-btn ${activeTab === 1 ? 'active' : ''}`}
            onClick={() => handleTabChange(1)}
          >
            Đăng ký
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="register-form">
          {/* Username Input */}
          <div className="form-group">
            <input
              type="text"
              className={`form-input ${formErrors.username ? 'error' : ''}`}
              name="username"
              placeholder="Tên đăng nhập"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
            {formErrors.username && (
              <div className="field-error">{formErrors.username}</div>
            )}
          </div>

          {/* Email Input */}
          <div className="form-group">
            <input
              type="email"
              className={`form-input ${formErrors.email ? 'error' : ''}`}
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            {formErrors.email && (
              <div className="field-error">{formErrors.email}</div>
            )}
          </div>

          {/* Password Input */}
          <div className="form-group">
            <input
              type="password"
              className={`form-input ${formErrors.password ? 'error' : ''}`}
              name="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            {formErrors.password && (
              <div className="field-error">{formErrors.password}</div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="form-group">
            <input
              type="password"
              className={`form-input ${formErrors.confirmPassword ? 'error' : ''}`}
              name="confirmPassword"
              placeholder="Xác nhận mật khẩu"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
            {formErrors.confirmPassword && (
              <div className="field-error">{formErrors.confirmPassword}</div>
            )}
          </div>

          {/* Phone Number Input */}
          <div className="form-group">
            <input
              type="text"
              className={`form-input ${formErrors.phoneNumber ? 'error' : ''}`}
              name="phoneNumber"
              placeholder="Số điện thoại"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
            />
            {formErrors.phoneNumber && (
              <div className="field-error">{formErrors.phoneNumber}</div>
            )}
          </div>

          {/* Address Input */}
          <div className="form-group">
            <input
              type="text"
              className={`form-input ${formErrors.address ? 'error' : ''}`}
              name="address"
              placeholder="Địa chỉ"
              value={formData.address}
              onChange={handleInputChange}
              required
            />
            {formErrors.address && (
              <div className="field-error">{formErrors.address}</div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner"></span>
            ) : (
              'Tạo tài khoản'
            )}
          </button>

          {/* Login Link */}
          <div className="login-link">
            <span>Đã có tài khoản? </span>
            <Link to="/login" className="link">
              Đăng nhập ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
