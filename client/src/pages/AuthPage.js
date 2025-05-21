import React, { useState } from 'react';
import { Container,  Box, TextField, Button, Paper, Tab, Tabs } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [tab, setTab] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    address: ''
  });
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (tab === 0) {
        // Login
        const response = await axios.post('/api/auth/login', {
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('token', response.data.token);
        navigate('/dashboard');
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          alert('Mật khẩu không khớp!');
          return;
        }
        const response = await axios.post('/api/auth/register', {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
          address: formData.address
        });
        localStorage.setItem('token', response.data.token);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra!');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Tabs value={tab} onChange={handleTabChange} centered>
            <Tab label="Đăng nhập" />
            <Tab label="Đăng ký" />
          </Tabs>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            {tab === 1 && (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Tên người dùng"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Số điện thoại"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Địa chỉ"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </>
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Mật khẩu"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
            />
            {tab === 1 && (
              <TextField
                margin="normal"
                required
                fullWidth
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              {tab === 0 ? 'Đăng nhập' : 'Đăng ký'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AuthPage;