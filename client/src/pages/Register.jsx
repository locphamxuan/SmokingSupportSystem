import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../style/Register.scss";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import OTPVerification from "../components/OTPVerification";

function Register() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(1); // 1 for Register, 0 for Login
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // State for form data
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    address: "",
  });

  // State for form errors
  const [formErrors, setFormErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    address: "",
  });

  // State for account type
  const [accountType, setAccountType] = useState("member"); // 'member' or 'coach'

  // OTP verification states
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [emailForOTP, setEmailForOTP] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);

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
      errors.username = "Vui lòng nhập tên đăng nhập";
    }

    if (!formData.email) {
      errors.email = "Vui lòng nhập email";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Email không hợp lệ";
    }

    if (!formData.password) {
      errors.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Mật khẩu không khớp";
    }

    if (!formData.phoneNumber) {
      errors.phoneNumber = "Vui lòng nhập số điện thoại";
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      errors.phoneNumber = "Số điện thoại phải có 10 chữ số";
    }

    if (!formData.address) {
      errors.address = "Vui lòng nhập địa chỉ";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle tab change
  const handleTabChange = (index) => {
    if (index === 0) {
      navigate("/login");
      return;
    }
    setActiveTab(index);
    setError("");
    setSuccess("");
    setFormErrors({});
  };

  // Handle input change
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormErrors({ ...formErrors, [e.target.name]: "" });
    setError("");
    setSuccess("");
  };

  // Handle form submission
  // Handle email verification request
  const handleEmailVerification = async () => {
    if (!validateEmail(formData.email)) {
      setError("Vui lòng nhập email hợp lệ");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/auth/send-otp", {
        email: formData.email,
      });

      if (response.data.success) {
        setEmailForOTP(formData.email);
        setShowOTPVerification(true);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Gửi mã OTP thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification success
  const handleOTPVerified = () => {
    setIsEmailVerified(true);
    setShowOTPVerification(false);
    setSuccess("Email đã được xác thực thành công!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Check if email is verified
    if (!isEmailVerified) {
      setError("Vui lòng xác thực email trước khi đăng ký");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const registerPayload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        role: accountType, // Gửi role lên backend
      };

      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        registerPayload,
      );

      if (response.status === 201) {
        if (accountType === "member") {
          setSuccess(
            "Bạn đã đăng ký thành công! Đang chuyển về trang đăng nhập...",
          );
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        } else if (accountType === "coach") {
          setSuccess(
            "Bạn đã đăng ký tài khoản huấn luyện viên thành công! Vui lòng chờ admin xác nhận trước khi đăng nhập.",
          );
        }
      }
    } catch (error) {
      console.error("Register error:", error);
      if (error.response) {
        setError(
          error.response.data.message || "Đăng ký thất bại. Vui lòng thử lại!",
        );
      } else if (error.request) {
        setError(
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!",
        );
      } else {
        setError("Đăng ký thất bại. Vui lòng thử lại!");
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

        {/* Success Message */}
        {success && <div className="success-message">{success}</div>}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="register-form">
          {/* Account Type Selection */}
          <div className="form-group mb-3 d-flex flex-column align-items-start">
            <div className="form-check mb-1">
              <input
                className="form-check-input"
                type="radio"
                name="accountType"
                id="accountTypeMember"
                value="member"
                checked={accountType === "member"}
                onChange={() => setAccountType("member")}
              />
              <label className="form-check-label" htmlFor="accountTypeMember">
                Tôi muốn đăng ký tài khoản thường
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="accountType"
                id="accountTypeCoach"
                value="coach"
                checked={accountType === "coach"}
                onChange={() => setAccountType("coach")}
              />
              <label className="form-check-label" htmlFor="accountTypeCoach">
                Tôi muốn đăng ký là huấn luyện viên
              </label>
            </div>
          </div>

          {/* Username Input */}
          <div className="form-group">
            <input
              type="text"
              className={`form-input ${formErrors.username ? "error" : ""}`}
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
              className={`form-input ${formErrors.email ? "error" : ""}`}
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            {formErrors.email && (
              <div className="field-error">{formErrors.email}</div>
            )}

            {/* Email Verification */}
            <div className="email-verification-section mt-2">
              {!isEmailVerified ? (
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={handleEmailVerification}
                  disabled={loading || !formData.email}
                >
                  {loading ? "Đang gửi..." : "Xác thực Email"}
                </button>
              ) : (
                <div className="text-success d-flex align-items-center">
                  <i className="fas fa-check-circle me-1"></i>
                  Email đã được xác thực
                </div>
              )}
            </div>
          </div>

          {/* Password Input */}
          <div className="form-group">
            <input
              type="password"
              className={`form-input ${formErrors.password ? "error" : ""}`}
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
              className={`form-input ${formErrors.confirmPassword ? "error" : ""}`}
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
              className={`form-input ${formErrors.phoneNumber ? "error" : ""}`}
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
              className={`form-input ${formErrors.address ? "error" : ""}`}
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
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? <span className="spinner"></span> : "Tạo tài khoản"}
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

      {/* OTP Verification Modal */}
      {showOTPVerification && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <OTPVerification
                email={emailForOTP}
                onVerificationSuccess={handleOTPVerified}
                onBack={() => setShowOTPVerification(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;
