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
  Typography,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import {
  Home as HomeIcon,
  Visibility,
  VisibilityOff,
  PersonAdd,
  Login,
  Email,
  Phone,
  LocationOn,
  Person,
  Lock,
  SmokeFree
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userType, setUserType] = useState('member');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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
        ? `${API_BASE_URL}/coach/login`
        : `${API_BASE_URL}/auth/login`;

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
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
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
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      padding: '20px 0'
    }}>
      <Container maxWidth="sm">
        {/* Nút quay về trang chủ */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
          <IconButton 
            onClick={() => navigate('/')}
            sx={{
              backgroundColor: 'white',
              color: '#1976d2',
              '&:hover': {
                backgroundColor: '#f0f0f0',
              },
              boxShadow: 1
            }}
          >
            <HomeIcon />
          </IconButton>
        </Box>

        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{ 
            textAlign: 'center', 
            py: 3,
            backgroundColor: '#1976d2',
            color: 'white'
          }}>
            <SmokeFree sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              Nền tảng hỗ trợ cai thuốc
            </Typography>
            <Typography variant="body2">
              Hành trình hướng tới cuộc sống khỏe mạnh
            </Typography>
          </Box>

          {/* Tabs */}
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              backgroundColor: 'white',
              '& .MuiTabs-indicator': {
                backgroundColor: '#1976d2',
              }
            }}
          >
            <Tab icon={<Login />} label="Đăng nhập" iconPosition="start" />
            <Tab icon={<PersonAdd />} label="Đăng ký" iconPosition="start" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Form đăng nhập */}
            {activeTab === 0 && (
              <Box component="form" onSubmit={handleLoginSubmit}>
                <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', color: '#333' }}>
                  Chào mừng trở lại!
                </Typography>

                {/* Chọn loại người dùng */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Loại tài khoản</InputLabel>
                  <Select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                  >
                    <MenuItem value="member">Thành viên</MenuItem>
                    <MenuItem value="coach">Huấn luyện viên</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  name="emailOrUsername"
                  label={userType === 'coach' ? 'Email' : 'Email hoặc tên đăng nhập'}
                  value={loginData.emailOrUsername}
                  onChange={handleLoginInputChange}
                  error={!!loginErrors.emailOrUsername}
                  helperText={loginErrors.emailOrUsername}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Mật khẩu"
                  value={loginData.password}
                  onChange={handleLoginInputChange}
                  error={!!loginErrors.password}
                  helperText={loginErrors.password}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{ mb: 2, py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Đăng nhập'}
                </Button>

                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Chưa có tài khoản?
                  </Typography>
                </Divider>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setActiveTab(1)}
                >
                  Tạo tài khoản mới
                </Button>
              </Box>
            )}

            {/* Form đăng ký */}
            {activeTab === 1 && (
              <Box component="form" onSubmit={handleRegisterSubmit}>
                <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', color: '#333' }}>
                  Tham gia cùng chúng tôi!
                </Typography>

                <TextField
                  fullWidth
                  name="username"
                  label="Tên đăng nhập"
                  value={registerData.username}
                  onChange={handleRegisterInputChange}
                  error={!!registerErrors.username}
                  helperText={registerErrors.username}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  name="email"
                  label="Email"
                  type="email"
                  value={registerData.email}
                  onChange={handleRegisterInputChange}
                  error={!!registerErrors.email}
                  helperText={registerErrors.email}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  name="phoneNumber"
                  label="Số điện thoại"
                  value={registerData.phoneNumber}
                  onChange={handleRegisterInputChange}
                  error={!!registerErrors.phoneNumber}
                  helperText={registerErrors.phoneNumber}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  name="address"
                  label="Địa chỉ"
                  value={registerData.address}
                  onChange={handleRegisterInputChange}
                  error={!!registerErrors.address}
                  helperText={registerErrors.address}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Mật khẩu"
                  value={registerData.password}
                  onChange={handleRegisterInputChange}
                  error={!!registerErrors.password}
                  helperText={registerErrors.password}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Xác nhận mật khẩu"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterInputChange}
                  error={!!registerErrors.confirmPassword}
                  helperText={registerErrors.confirmPassword}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{ mb: 2, py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Đăng ký'}
                </Button>

                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Đã có tài khoản?
                  </Typography>
                </Divider>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setActiveTab(0)}
                >
                  Đăng nhập ngay
                </Button>
              </Box>
            )}
          </Box>

          {/* Footer */}
          <Box sx={{ 
            textAlign: 'center', 
            py: 2,
            backgroundColor: '#f8f8f8',
            borderTop: '1px solid #e0e0e0'
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Tham gia cộng đồng hỗ trợ cai thuốc lá
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hỗ trợ 24/7 - Hotline: 1800-8888-77
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage; 