import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // ✅ Thêm axios
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { motion, AnimatePresence } from 'framer-motion';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      const { token, user } = res.data;

      // ✅ Lưu token và user
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // ✅ Chuyển trang tùy role
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setShowModal(true); // Hiện modal nếu tài khoản chưa tồn tại
      } else {
        setErrorMsg(err.response?.data?.message || 'Lỗi đăng nhập');
      }
    }
  };

  const handleGoToRegister = () => {
    setShowModal(false);
    navigate('/register', { state: { email } });
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <h2 className="login-title">Đăng nhập</h2>

        {errorMsg && <p className="text-danger mb-3">{errorMsg}</p>}

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
