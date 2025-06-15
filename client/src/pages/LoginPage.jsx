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
  MenuItem,
  Typography,
  Card,
  CardContent,
  Divider,
  Grid
} from '@mui/material';
import { 
  Home as HomeIcon, 
  FavoriteRounded as HealthIcon,
  AirRounded as BreathIcon,
  LocalFloristRounded as LeafIcon,
  EmojiEventsRounded as TrophyIcon,
  PersonAdd as RegisterIcon,
  Login as LoginIcon
} from '@mui/icons-material';
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

  // Array các câu động viên về cai thuốc lá
  const motivationalQuotes = [
    "Mỗi ngày không hút thuốc là một chiến thắng! 🏆",
    "Hãy thở sâu và cảm nhận không khí trong lành 🌿",
    "Sức khỏe của bạn là tài sản quý giá nhất 💚",
    "Hành trình cai thuốc bắt đầu từ quyết tâm của bạn ✨",
    "Mỗi phút không hút thuốc, phổi bạn đang hồi phục 🫁"
  ];

  const [currentQuote] = useState(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);

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
      const endpoint = 'http://localhost:5000/api/auth/register';
      const registerPayload = {
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
        phoneNumber: registerData.phoneNumber,
        address: registerData.address
      };

      const response = await axios.post(endpoint, registerPayload);
      
      if (response.data.success) {
        // Đăng ký thành công, chuyển về tab đăng nhập
        setActiveTab(0);
        setRegisterData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          phoneNumber: '',
          address: ''
        });
        setError('');
        alert('Đăng ký thành công! Vui lòng đăng nhập.');
      }
    } catch (error) {
      // Xử lý lỗi đăng ký
      setError(error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: '#f8f9fa',
      py: 4
    }}>
      <Container maxWidth="xl">
        {/* Header với nút về trang chủ */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton 
            onClick={() => navigate('/')}
            sx={{ 
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              '&:hover': { 
                background: '#4a90e2',
                color: 'white'
              }
            }}
          >
            <HomeIcon />
          </IconButton>
          
          <Typography variant="h4" sx={{ 
            fontWeight: 600,
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <LeafIcon sx={{ color: '#28a745', fontSize: 32 }} />
            Nền tảng hỗ trợ cai thuốc lá
          </Typography>
          
          <Box sx={{ width: 48 }} /> {/* Spacer for center alignment */}
        </Box>

        <Grid container spacing={4} sx={{ justifyContent: 'center', alignItems: 'flex-start' }}>
          
          {/* Left Side - Motivational Content */}
          <Grid item xs={12} lg={6} xl={5}>
            <Box sx={{ maxWidth: 500, mx: 'auto' }}>
              
              {/* Welcome Hero Card */}
              <Card sx={{ 
                mb: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                textAlign: 'center'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ mb: 3 }}>
                    <TrophyIcon sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                      Chào mừng bạn!
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                      Hành trình cai thuốc lá bắt đầu từ đây
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* Daily Motivation */}
              <Card sx={{ mb: 3, background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <HealthIcon sx={{ fontSize: 40, color: '#4a90e2', mb: 2 }} />
                  <Typography variant="h6" color="#333" fontWeight="600" gutterBottom>
                    💪 Động lực hôm nay
                  </Typography>
                  <Typography variant="body1" color="#666" sx={{ fontStyle: 'italic', fontSize: '1.1rem' }}>
                    {currentQuote}
                  </Typography>
                </CardContent>
              </Card>

              {/* Health Benefits Timeline */}
              <Card sx={{ background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" color="#333" fontWeight="600" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
                    🌟 Lợi ích khi bỏ thuốc lá
                  </Typography>
                  
                  <Box sx={{ space: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                      <Box sx={{ 
                        minWidth: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        background: '#e91e63', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        <HealthIcon sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="600" color="#333">
                          20 phút đầu tiên
                        </Typography>
                        <Typography variant="body2" color="#666">
                          Nhịp tim và huyết áp giảm xuống bình thường
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                      <Box sx={{ 
                        minWidth: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        background: '#00bcd4', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        <BreathIcon sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="600" color="#333">
                          12 giờ
                        </Typography>
                        <Typography variant="body2" color="#666">
                          CO trong máu giảm xuống mức bình thường
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                      <Box sx={{ 
                        minWidth: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        background: '#28a745', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        <LeafIcon sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="600" color="#333">
                          1 năm
                        </Typography>
                        <Typography variant="body2" color="#666">
                          Giảm 50% nguy cơ mắc bệnh tim mạch
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>

          {/* Right Side - Login/Register Form */}
          <Grid item xs={12} lg={6} xl={5}>
            <Box sx={{ maxWidth: 500, mx: 'auto' }}>
              <Paper elevation={3} sx={{ 
                borderRadius: 3,
                overflow: 'hidden',
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                
                {/* Form Header */}
                <Box sx={{ 
                  background: '#4a90e2',
                  color: 'white',
                  p: 3,
                  textAlign: 'center'
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                    {activeTab === 0 ? <LoginIcon sx={{ mr: 1 }} /> : <RegisterIcon sx={{ mr: 1 }} />}
                    <Typography variant="h4" component="h1" fontWeight="600">
                      {activeTab === 0 ? 'Đăng nhập' : 'Đăng ký'}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    {activeTab === 0 ? 'Chào mừng bạn trở lại!' : 'Tham gia cộng đồng cai thuốc lá'}
                  </Typography>
                </Box>

                <Box sx={{ p: 4 }}>
                  {/* Tabs */}
                  <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange} 
                    centered 
                    sx={{ 
                      mb: 3,
                      '& .MuiTab-root': {
                        fontWeight: '600',
                        fontSize: '1rem',
                        textTransform: 'none',
                        '&.Mui-selected': {
                          color: '#4a90e2'
                        }
                      },
                      '& .MuiTabs-indicator': {
                        backgroundColor: '#4a90e2',
                        height: 3,
                        borderRadius: '3px 3px 0 0'
                      }
                    }}
                  >
                    <Tab label="Đăng nhập" />
                    <Tab label="Đăng ký" />
                  </Tabs>

                  {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                      {error}
                    </Alert>
                  )}

                  {/* Login Form */}
                  {activeTab === 0 ? (
                    <Box component="form" onSubmit={handleLoginSubmit}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Loại tài khoản</InputLabel>
                        <Select
                          value={userType}
                          onChange={(e) => setUserType(e.target.value)}
                          label="Loại tài khoản"
                          sx={{
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4a90e2' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4a90e2' }
                          }}
                        >
                          <MenuItem value="member">👤 Thành viên</MenuItem>
                          <MenuItem value="coach">🏥 Huấn luyện viên</MenuItem>
                          <MenuItem value="admin">⚙️ Quản trị viên</MenuItem>
                        </Select>
                      </FormControl>

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
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: '#4a90e2' },
                            '&.Mui-focused fieldset': { borderColor: '#4a90e2' }
                          },
                          '& .MuiInputLabel-root.Mui-focused': { color: '#4a90e2' }
                        }}
                      />

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
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: '#4a90e2' },
                            '&.Mui-focused fieldset': { borderColor: '#4a90e2' }
                          },
                          '& .MuiInputLabel-root.Mui-focused': { color: '#4a90e2' }
                        }}
                      />

                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={loading}
                        sx={{ 
                          mt: 3, 
                          mb: 2, 
                          height: 56,
                          backgroundColor: '#4a90e2',
                          fontWeight: '600',
                          fontSize: '1.1rem',
                          textTransform: 'none',
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor: '#3d7bc6'
                          }
                        }}
                      >
                        {loading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          <>
                            <LoginIcon sx={{ mr: 1 }} />
                            Đăng nhập
                          </>
                        )}
                      </Button>

                      <Divider sx={{ my: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          hoặc
                        </Typography>
                      </Divider>

                      <Box sx={{ textAlign: 'center' }}>
                        <Link 
                          href="#" 
                          variant="body2" 
                          onClick={(e) => e.preventDefault()} 
                          sx={{ 
                            color: '#4a90e2',
                            textDecoration: 'none',
                            fontWeight: '500',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          Quên mật khẩu? Chúng tôi sẽ giúp bạn!
                        </Link>
                      </Box>
                    </Box>
                  ) : (
                    /* Register Form */
                    <Box component="form" onSubmit={handleRegisterSubmit}>
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
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: '#4a90e2' },
                            '&.Mui-focused fieldset': { borderColor: '#4a90e2' }
                          },
                          '& .MuiInputLabel-root.Mui-focused': { color: '#4a90e2' }
                        }}
                      />

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
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: '#4a90e2' },
                            '&.Mui-focused fieldset': { borderColor: '#4a90e2' }
                          },
                          '& .MuiInputLabel-root.Mui-focused': { color: '#4a90e2' }
                        }}
                      />

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
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: '#4a90e2' },
                            '&.Mui-focused fieldset': { borderColor: '#4a90e2' }
                          },
                          '& .MuiInputLabel-root.Mui-focused': { color: '#4a90e2' }
                        }}
                      />

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
                        multiline
                        rows={2}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: '#4a90e2' },
                            '&.Mui-focused fieldset': { borderColor: '#4a90e2' }
                          },
                          '& .MuiInputLabel-root.Mui-focused': { color: '#4a90e2' }
                        }}
                      />

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
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: '#4a90e2' },
                            '&.Mui-focused fieldset': { borderColor: '#4a90e2' }
                          },
                          '& .MuiInputLabel-root.Mui-focused': { color: '#4a90e2' }
                        }}
                      />

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
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: '#4a90e2' },
                            '&.Mui-focused fieldset': { borderColor: '#4a90e2' }
                          },
                          '& .MuiInputLabel-root.Mui-focused': { color: '#4a90e2' }
                        }}
                      />

                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={loading}
                        sx={{ 
                          mt: 3, 
                          mb: 2, 
                          height: 56,
                          backgroundColor: '#28a745',
                          fontWeight: '600',
                          fontSize: '1.1rem',
                          textTransform: 'none',
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor: '#218838'
                          }
                        }}
                      >
                        {loading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          <>
                            <RegisterIcon sx={{ mr: 1 }} />
                            Tạo tài khoản
                          </>
                        )}
                      </Button>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default LoginPage; 
