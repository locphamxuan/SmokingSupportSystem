import React from "react";
import Form from "react-bootstrap/Form";
import "./Register.css";

function Register() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Xử lý đăng ký người dùng ở đây
    alert("Đăng ký thành công (giả lập)!");
  };

  return (
    <div className="register-wrapper">
      <div className="register-container">
        <h2 className="register-title">Tạo Tài Khoản Mới</h2>
        <Form className="register-form" onSubmit={handleSubmit}>
          <Form.Group controlId="formEmail" className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" placeholder="Nhập email" required />
          </Form.Group>

          <Form.Group controlId="formPassword" className="mb-3">
            <Form.Label>Mật khẩu</Form.Label>
            <Form.Control type="password" placeholder="Nhập mật khẩu" required />
          </Form.Group>

          <Form.Group controlId="formPhone" className="mb-3">
            <Form.Label>Số điện thoại</Form.Label>
            <Form.Control type="text" placeholder="Nhập số điện thoại" required />
          </Form.Group>

          <Form.Group controlId="formAddress" className="mb-4">
            <Form.Label>Địa chỉ</Form.Label>
            <Form.Control type="text" placeholder="Nhập địa chỉ" required />
          </Form.Group>

          <button type="submit" className="btn-register">
            Đăng ký
          </button>
        </Form>
      </div>
    </div>
  );
}

export default Register;
