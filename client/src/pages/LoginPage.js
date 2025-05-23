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
  Link
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({ email: '', password: '' });
  
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
    if (!loginData.email) {
      errors.email = 'Email is required!';
    } else if (!validateEmail(loginData.email)) {
      errors.email = 'Invalid email';
    }
    if (!loginData.password) {
      errors.password = 'Password is required';
    }
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegisterForm = () => {
    const errors = {};
    if (!registerData.username) {
      errors.username = 'Username is required';
    }
    if (!registerData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(registerData.email)) {
      errors.email = 'Invalid email';
    }
    if (!registerData.phoneNumber) {
      errors.phoneNumber = 'Phone Number is required!';
    } else if (!validatePhoneNumber(registerData.phoneNumber)) {
      errors.phoneNumber = 'Phone Number must have 10 number';
    }
    if (!registerData.address) {
      errors.address = 'Address is required';
    }
    if (!registerData.password) {
      errors.password = 'Password is required';
    } else if (registerData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (!registerData.confirmPassword) {
      errors.confirmPassword = 'Password confirmation is required';
    } else if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      const response = await axios.post('/api/auth/login', loginData);
      const { token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set default authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      if (user.role === 'admin') {
        navigate('/admin/users');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
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
      const response = await axios.post('/api/auth/register', {
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
        phoneNumber: registerData.phoneNumber,
        address: registerData.address
      });
      localStorage.setItem('token', response.data.token);
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed. Please try again!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <h2>{activeTab === 0 ? 'Login' : 'Register'}</h2>
          </Box>
          
          <Tabs value={activeTab} onChange={handleTabChange} centered sx={{ mb: 3 }}>
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {activeTab === 0 ? (
            // Login Form
            <Box component="form" onSubmit={handleLoginSubmit} sx={{ mt: 3 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={loginData.email}
                onChange={handleLoginInputChange}
                error={!!loginErrors.email}
                helperText={loginErrors.email}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
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
                  Forgot password?
                </Link>
              </Box>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Login'}
              </Button>
            </Box>
          ) : (


            // Register Form
            <Box component="form" onSubmit={handleRegisterSubmit} sx={{ mt: 3 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Username"
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
                label="phone"
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
                label="Address"
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
                label="Password"
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
                label="Confirm password"
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
                {loading ? <CircularProgress size={24} /> : 'Register'}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage; 