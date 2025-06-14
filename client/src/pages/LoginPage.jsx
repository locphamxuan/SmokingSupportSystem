import React, { useState } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Link,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const LoginPage = () => {
  const { login } = useAuth();
  
  // State quản lý tab đang hoạt động (Đăng nhập/Đăng ký)
  const [activeTab, setActiveTab] = useState(0);
  // State quản lý trạng thái tải (loading)
  const [loading, setLoading] = useState(false);
  // State quản lý thông báo lỗi
  const [error, setError] = useState('');
  // State quản lý loại người dùng (thành viên, huấn luyện viên, quản trị viên)
  const [userType, setUserType] = useState('member'); 
  
  // State và lỗi cho form đăng nhập
  const [loginData, setLoginData] = useState({ emailOrUsername: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({ emailOrUsername: '', password: '' });
  
  // State và lỗi cho form đăng ký
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

  // Hàm kiểm tra định dạng email
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Hàm kiểm tra định dạng số điện thoại
  const validatePhoneNumber = (phone) => {
    const re = /^[0-9]{10}$/;
    return re.test(phone);
  };

  // Hàm kiểm tra lỗi form đăng nhập
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

  // Hàm kiểm tra lỗi form đăng ký
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

  // Xử lý thay đổi tab
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
    setLoginErrors({});
    setRegisterErrors({});
  };

  // Xử lý thay đổi input form đăng nhập
  const handleLoginInputChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    setLoginErrors({ ...loginErrors, [e.target.name]: '' });
  };

  // Xử lý thay đổi input form đăng ký
  const handleRegisterInputChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    setRegisterErrors({ ...registerErrors, [e.target.name]: '' });
  };

  // Xử lý submit form đăng nhập
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    // Kiểm tra hợp lệ form
    if (!validateLoginForm()) return;

    setLoading(true);
    setError('');
    try {
      localStorage.clear(); // Xóa dữ liệu cũ trong localStorage
      const endpoint = 'http://localhost:5000/api/auth/login';
      const loginPayload = {
        emailOrUsername: loginData.emailOrUsername,
        password: loginData.password
      };

      const response = await axios.post(endpoint, loginPayload);
      const { token, user } = response.data;

      // Kiểm tra role với userType đã chọn
      if (
        (userType === 'member' && user.role !== 'member' && user.role !== 'guest' && user.role !== 'user') ||
        (userType === 'coach' && user.role !== 'coach') ||
        (userType === 'admin' && user.role !== 'admin')
      ) {
        setError('Tài khoản không đúng loại bạn đã chọn!');
        setLoading(false);
        return;
      }

      // Sử dụng AuthContext để login
      login(user, token);
      
      // Thiết lập token cho các request axios tiếp theo
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Điều hướng người dùng đến trang phù hợp dựa trên vai trò
      if (user.role === 'coach') {
        navigate('/coach-portal');
      } else if (user.role === 'admin') {
        navigate('/admin/users');
      } else {
        navigate('/');
      }
    } catch (error) {
      // Xử lý lỗi đăng nhập
      setError(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý submit form đăng ký
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    // Kiểm tra hợp lệ form
    if (!validateRegisterForm()) return;
    
    setLoading(true);
    setError('');
    try {
      localStorage.clear(); // Xóa dữ liệu cũ trong localStorage
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
        phoneNumber: registerData.phoneNumber,
        address: registerData.address
      });
      
      const { token, user } = response.data;
      // Sử dụng AuthContext để login sau khi đăng ký thành công
      login(user, token);
      
      // Thiết lập token cho các request axios tiếp theo
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setError('');
      // Điều hướng người dùng về trang chủ sau khi đăng ký thành công
      navigate('/');
    } catch (error) {
      // Xử lý lỗi đăng ký
      console.error('Lỗi đăng ký:', error);
      setError(error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          {/* Nút quay về trang chủ */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Tooltip title="Quay về trang chủ">
              <IconButton 
                onClick={() => navigate('/')}
                sx={{ 
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'white'
                  }
                }}
              >
                <HomeIcon />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <h2>{activeTab === 0 ? 'Đăng nhập' : 'Đăng ký'}</h2>
          </Box>
          
          <Tabs value={activeTab} onChange={handleTabChange} centered sx={{ mb: 3 }}>
            <Tab label="Đăng nhập" />
            <Tab label="Đăng ký" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Form Đăng nhập */}
          {activeTab === 0 ? (
            <Box component="form" onSubmit={handleLoginSubmit} sx={{ mt: 3 }}>
              {/* Chọn loại tài khoản */}
              <FormControl fullWidth margin="normal">
                <InputLabel>Loại tài khoản</InputLabel>
                <Select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  label="Loại tài khoản"
                >
                  <MenuItem value="member">Thành viên</MenuItem>
                  <MenuItem value="coach">Huấn luyện viên</MenuItem>
                  <MenuItem value="admin">Quản trị viên</MenuItem>
                </Select>
              </FormControl>
              {/* Trường Email hoặc Tên đăng nhập */}
              <TextField
                label="Email hoặc Tên đăng nhập"
                variant="outlined"
                fullWidth
                margin="normal"
                name="emailOrUsername"
                value={loginData.emailOrUsername}
                onChange={handleLoginInputChange}
                error={!!loginErrors.emailOrUsername}
                helperText={loginErrors.emailOrUsername}
              />
              {/* Trường Mật khẩu */}
              <TextField
                label="Mật khẩu"
                type="password"
                variant="outlined"
                fullWidth
                margin="normal"
                name="password"
                value={loginData.password}
                onChange={handleLoginInputChange}
                error={!!loginErrors.password}
                helperText={loginErrors.password}
              />
              {/* Nút Đăng nhập */}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                sx={{ mt: 3, mb: 2, height: 50 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Đăng nhập'}
              </Button>
              {/* Link quên mật khẩu */}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link href="#" variant="body2" onClick={(e) => e.preventDefault()} sx={{ color: 'primary.main' }}>
                  Quên mật khẩu?
                </Link>
              </Box>
            </Box>
          ) : (
            /* Form Đăng ký */
            <Box component="form" onSubmit={handleRegisterSubmit} sx={{ mt: 3 }}>
              {/* Trường Tên đăng nhập */}
              <TextField
                label="Tên đăng nhập"
                variant="outlined"
                fullWidth
                margin="normal"
                name="username"
                value={registerData.username}
                onChange={handleRegisterInputChange}
                error={!!registerErrors.username}
                helperText={registerErrors.username}
              />
              {/* Trường Email */}
              <TextField
                label="Email"
                variant="outlined"
                fullWidth
                margin="normal"
                name="email"
                value={registerData.email}
                onChange={handleRegisterInputChange}
                error={!!registerErrors.email}
                helperText={registerErrors.email}
              />
              {/* Trường Số điện thoại */}
              <TextField
                label="Số điện thoại"
                variant="outlined"
                fullWidth
                margin="normal"
                name="phoneNumber"
                value={registerData.phoneNumber}
                onChange={handleRegisterInputChange}
                error={!!registerErrors.phoneNumber}
                helperText={registerErrors.phoneNumber}
              />
              {/* Trường Địa chỉ */}
              <TextField
                label="Địa chỉ"
                variant="outlined"
                fullWidth
                margin="normal"
                name="address"
                value={registerData.address}
                onChange={handleRegisterInputChange}
                error={!!registerErrors.address}
                helperText={registerErrors.address}
              />
              {/* Trường Mật khẩu */}
              <TextField
                label="Mật khẩu"
                type="password"
                variant="outlined"
                fullWidth
                margin="normal"
                name="password"
                value={registerData.password}
                onChange={handleRegisterInputChange}
                error={!!registerErrors.password}
                helperText={registerErrors.password}
              />
              {/* Trường Xác nhận mật khẩu */}
              <TextField
                label="Xác nhận mật khẩu"
                type="password"
                variant="outlined"
                fullWidth
                margin="normal"
                name="confirmPassword"
                value={registerData.confirmPassword}
                onChange={handleRegisterInputChange}
                error={!!registerErrors.confirmPassword}
                helperText={registerErrors.confirmPassword}
              />
              {/* Nút Đăng ký */}
              <Button
                type="submit"
                variant="contained"
                color="secondary"
                fullWidth
                size="large"
                sx={{ mt: 3, mb: 2, height: 50 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Đăng ký'}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage; 
