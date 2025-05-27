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

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('member'); // 'member' or 'coach'
  
  const [loginData, setLoginData] = useState({ emailOrUsername: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({ emailOrUsername: '', password: '' });
  
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

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhoneNumber = (phone) => {
    const re = /^[0-9]{10}$/;
    return re.test(phone);
  };

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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
    setLoginErrors({});
    setRegisterErrors({});
  };

  const handleLoginInputChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    setLoginErrors({ ...loginErrors, [e.target.name]: '' });
  };

  const handleRegisterInputChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    setRegisterErrors({ ...registerErrors, [e.target.name]: '' });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLoginForm()) return;
    
    setLoading(true);
    setError('');
    try {
      const endpoint = userType === 'coach' 
        ? 'http://localhost:5000/api/coach/login'
        : 'http://localhost:5000/api/auth/login';

      const loginPayload = userType === 'coach' 
        ? { email: loginData.emailOrUsername, password: loginData.password }
        : loginData;

      const response = await axios.post(endpoint, loginPayload);
      const { token, user, coach } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user || coach));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      if (userType === 'coach') {
        navigate('/coach-portal');
      } else if (user?.role === 'admin') {
        navigate('/admin/users');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      setError(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
        phoneNumber: registerData.phoneNumber,
        address: registerData.address
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setError('');
      navigate('/');
    } catch (error) {
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

          {activeTab === 0 ? (
            <Box component="form" onSubmit={handleLoginSubmit} sx={{ mt: 3 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Loại tài khoản</InputLabel>
                <Select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  label="Loại tài khoản"
                >
                  <MenuItem value="member">Thành viên</MenuItem>
                  <MenuItem value="coach">Huấn luyện viên</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                margin="normal"
                required
                fullWidth
                label={userType === 'coach' ? "Email" : "Email hoặc Tên đăng nhập"}
                name="emailOrUsername"
                value={loginData.emailOrUsername}
                onChange={handleLoginInputChange}
                error={!!loginErrors.emailOrUsername}
                helperText={loginErrors.emailOrUsername}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Mật khẩu"
                name="password"
                type="password"
                value={loginData.password}
                onChange={handleLoginInputChange}
                error={!!loginErrors.password}
                helperText={loginErrors.password}
                disabled={loading}
              />
              <Box sx={{ mt: 1, mb: 2, textAlign: 'right' }}>
                <Link href="/forgot-password" variant="body2">
                  Quên mật khẩu?
                </Link>
              </Box>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Đăng nhập'}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleRegisterSubmit} sx={{ mt: 3 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Tên đăng nhập"
                name="username"
                value={registerData.username}
                onChange={handleRegisterInputChange}
                error={!!registerErrors.username}
                helperText={registerErrors.username}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Số điện thoại"
                name="phoneNumber"
                value={registerData.phoneNumber}
                onChange={handleRegisterInputChange}
                error={!!registerErrors.phoneNumber}
                helperText={registerErrors.phoneNumber}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Địa chỉ"
                name="address"
                value={registerData.address}
                onChange={handleRegisterInputChange}
                error={!!registerErrors.address}
                helperText={registerErrors.address}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={registerData.email}
                onChange={handleRegisterInputChange}
                error={!!registerErrors.email}
                helperText={registerErrors.email}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Mật khẩu"
                name="password"
                type="password"
                value={registerData.password}
                onChange={handleRegisterInputChange}
                error={!!registerErrors.password}
                helperText={registerErrors.password}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                type="password"
                value={registerData.confirmPassword}
                onChange={handleRegisterInputChange}
                error={!!registerErrors.confirmPassword}
                helperText={registerErrors.confirmPassword}
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Đăng ký'}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage; 