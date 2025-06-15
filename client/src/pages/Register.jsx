import React from "react";
import "bootstrap/dist/css/bootstrap.min.css"; 
import "../style/Register.scss"; 
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom"; 

function Register() {
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Đăng ký thành công (giả lập)!");
    navigate('/login'); 
  };

  return (
    <div className="auth-page-wrapper d-flex align-items-center justify-content-center min-vh-100">
      <div className="auth-container card shadow-lg rounded-lg overflow-hidden row no-gutters">
        <div className="auth-image-half d-none d-md-block col-md-6">
          <div className="image-overlay d-flex flex-column justify-content-center align-items-center text-white p-4">
            <h2 className="mb-3 text-center">Bắt đầu hành trình cai nghiện thuốc lá ngay hôm nay!</h2>
            <p className="text-center">Đăng ký để nhận được sự hỗ trợ từ cộng đồng và chuyên gia.</p>
          </div>
        </div>
        <div className="auth-form-half col-md-6 p-4 d-flex flex-column justify-content-center">
          <div className="text-center mb-4">
            <h2 className="mb-3">Đăng ký</h2>
            <p className="text-muted">Tạo tài khoản mới của bạn</p>
          </div>
          <form className="register-form" onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="formUsername" className="form-label">Tên đăng nhập</label>
              <input type="text" className="form-control" id="formUsername" placeholder="Nhập tên đăng nhập" required />
            </div>

            <div className="mb-3">
              <label htmlFor="formEmail" className="form-label">Email</label>
              <input type="email" className="form-control" id="formEmail" placeholder="Nhập email" required />
            </div>

            <div className="mb-3">
              <label htmlFor="formPassword" className="form-label">Mật khẩu</label>
              <input type="password" className="form-control" id="formPassword" placeholder="Nhập mật khẩu" required />
            </div>

            <div className="mb-3">
              <label htmlFor="formConfirmPassword" className="form-label">Xác nhận mật khẩu</label>
              <input type="password" className="form-control" id="formConfirmPassword" placeholder="Xác nhận mật khẩu" required />
            </div>

            <div className="mb-3">
              <label htmlFor="formPhone" className="form-label">Số điện thoại</label>
              <input type="text" className="form-control" id="formPhone" placeholder="Nhập số điện thoại" required />
            </div>

            <div className="mb-4">
              <label htmlFor="formAddress" className="form-label">Địa chỉ</label>
              <input type="text" className="form-control" id="formAddress" placeholder="Nhập địa chỉ" required />
            </div>

            <button type="submit" className="btn btn-success w-100 py-2">
              Đăng ký
            </button>

            <div className="text-center mt-3">
              Đã có tài khoản? <Link to="/login" className="text-success text-decoration-none">Đăng nhập ngay</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
