import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { motion, AnimatePresence } from 'framer-motion';
import './style/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const existingUsers = ['abc@gmail.com', 'test@example.com'];
    const accountExists = existingUsers.includes(email.toLowerCase());

    if (!accountExists) {
      setShowModal(true);
    } else {
      alert('Đăng nhập thành công!');
      // navigate('/home'); // nếu cần chuyển hướng sau khi login
    }
  };

  const handleGoToRegister = () => {
    navigate('/register');
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <h2 className="login-title">Đăng nhập</h2>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Địa chỉ Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Nhập email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Mật khẩu</Form.Label>
            <Form.Control
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100">
            Đăng nhập
          </Button>
        </Form>
        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="custom-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="custom-modal-content"
                initial={{ y: "-100vh", opacity: 0 }}
                animate={{ y: "0", opacity: 1 }}
                exit={{ y: "-100vh", opacity: 0 }}
                transition={{ type: "spring", stiffness: 120 }}
              >
                <h4 className="mb-3">Tài khoản chưa tồn tại</h4>
                <p>
                  Tài khoản <strong>{email}</strong> chưa được đăng ký.
                  Bạn có muốn tạo tài khoản mới không?
                </p>
                <div className="text-end mt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)} className="me-2">
                    Hủy
                  </Button>
                  <Button variant="success" onClick={handleGoToRegister}>
                    Đăng ký
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Login;