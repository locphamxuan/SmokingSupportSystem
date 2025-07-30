import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "../style/LoginPage.scss";

const LoginPage = () => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState(0); // 0 for Login, 1 for Register
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userType, setUserType] = useState("member");

  // State and errors for login form
  const [loginData, setLoginData] = useState({
    emailOrUsername: "",
    password: "",
  });
  const [loginErrors, setLoginErrors] = useState({
    emailOrUsername: "",
    password: "",
  });

  // State and errors for register form (kept for consistency, though Register.jsx will handle actual registration)
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    address: "",
  });
  const [registerErrors, setRegisterErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    address: "",
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
      errors.emailOrUsername = "Vui lòng nhập email hoặc tên đăng nhập!";
    }
    if (!loginData.password) {
      errors.password = "Vui lòng nhập mật khẩu";
    }
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Register form validation (for client-side check, actual registration handled by Register.jsx)
  const validateRegisterForm = () => {
    const errors = {};
    if (!registerData.username) {
      errors.username = "Vui lòng nhập tên đăng nhập";
    }
    if (!registerData.email) {
      errors.email = "Vui lòng nhập email";
    } else if (!validateEmail(registerData.email)) {
      errors.email = "Email không hợp lệ";
    }
    if (!registerData.phoneNumber) {
      errors.phoneNumber = "Vui lòng nhập số điện thoại!";
    } else if (!validatePhoneNumber(registerData.phoneNumber)) {
      errors.phoneNumber = "Số điện thoại phải có 10 chữ số";
    }
    if (!registerData.address) {
      errors.address = "Vui lòng nhập địa chỉ";
    }
    if (!registerData.password) {
      errors.password = "Vui lòng nhập mật khẩu";
    } else if (registerData.password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }
    if (!registerData.confirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = "Mật khẩu không khớp";
    }
    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle tab change
  const handleTabChange = (index) => {
    if (index === 1) {
      navigate("/register");
      return;
    }
    setActiveTab(index);
    setError("");
    setLoginErrors({});
    setRegisterErrors({});
  };

  // Handle login input change
  const handleLoginInputChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    setLoginErrors({ ...loginErrors, [e.target.name]: "" });
  };

  // Handle register input change
  const handleRegisterInputChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    setRegisterErrors({ ...registerErrors, [e.target.name]: "" });
  };

  // Handle login form submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setLoading(true);
    setError("");
    try {
      localStorage.clear();
      const endpoint = "http://localhost:5000/api/auth/login";
      const loginPayload = {
        emailOrUsername: loginData.emailOrUsername,
        password: loginData.password,
      };

      const response = await axios.post(endpoint, loginPayload);
      const { token, user } = response.data;

      // Đảm bảo user data có đúng format
      const normalizedUser = {
        ...user,
        isMemberVip: user.isMemberVip || false,
        role: user.role || "member",
      };

      if (
        (userType === "member" &&
          normalizedUser.role !== "member" &&
          normalizedUser.role !== "memberVip") ||
        (userType === "coach" && normalizedUser.role !== "coach") ||
        (userType === "admin" && normalizedUser.role !== "admin")
      ) {
        setError("Tài khoản không đúng loại bạn đã chọn!");
        setLoading(false);
        return;
      }

      login(normalizedUser, token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      if (normalizedUser.role === "coach") {
        navigate("/coach-portal");
      } else if (normalizedUser.role === "admin") {
        navigate("/admin/users");
      } else {
        navigate("/");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng thử lại!",
      );
    } finally {
      setLoading(false);
    }
  };

  // handleRegisterSubmit function in LoginPage is primarily for validation, actual registration handled by Register.jsx
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;

    setLoading(true);
    setError("");
    try {
      // For actual registration, user is redirected to Register.jsx
      // This part here is mainly for showing loading/error states in LoginPage's register tab
      // In a real scenario, you'd make an API call from Register.jsx
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      setError(
        "Đăng ký không được thực hiện từ trang này. Vui lòng sử dụng trang Đăng ký riêng.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-auth-wrapper">
      <div className="auth-form-container">
        {/* User Avatar */}
        <div className="user-avatar">
          <div className="avatar-circle">
            <i className="fas fa-user"></i>
          </div>
          <div className="status-indicator"></div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 0 ? "active" : ""}`}
            onClick={() => handleTabChange(0)}
          >
            Đăng nhập
          </button>
          <button
            className={`tab-btn ${activeTab === 1 ? "active" : ""}`}
            onClick={() => handleTabChange(1)}
          >
            Đăng ký
          </button>
        </div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="login-form">
          {/* User Type Selection */}
          <div className="form-group">
            <select
              className="form-input"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
            >
              <option value="member">Thành viên</option>
              <option value="coach">Huấn luyện viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>

          {/* Email Input */}
          <div className="form-group">
            <input
              type="text"
              className={`form-input ${loginErrors.emailOrUsername ? "error" : ""}`}
              name="emailOrUsername"
              placeholder="Email hoặc tên đăng nhập"
              value={loginData.emailOrUsername}
              onChange={handleLoginInputChange}
              required
            />
            {loginErrors.emailOrUsername && (
              <div className="field-error">{loginErrors.emailOrUsername}</div>
            )}
          </div>

          {/* Password Input */}
          <div className="form-group">
            <input
              type="password"
              className={`form-input ${loginErrors.password ? "error" : ""}`}
              name="password"
              placeholder="Mật khẩu"
              value={loginData.password}
              onChange={handleLoginInputChange}
              required
            />
            {loginErrors.password && (
              <div className="field-error">{loginErrors.password}</div>
            )}
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? <span className="spinner"></span> : "Đăng nhập"}
          </button>

          
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
