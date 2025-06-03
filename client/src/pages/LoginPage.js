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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
  Card,
  Avatar,
  Chip,
  Grid,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Home as HomeIcon,
  HealthAndSafety as HealthIcon,
  FavoriteBorder as HeartIcon,
  EmojiEmotions as HappyIcon,
  LocalHospital as MedicalIcon,
  TrendingUp as ProgressIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as AddressIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
  const theme = useTheme();

  // Motivation quotes for smoking cessation
  const motivationQuotes = [
    "🌟 Mỗi ngày không hút thuốc là một chiến thắng!",
    "💪 Bạn mạnh mẽ hơn cơn nghiện!",
    "❤️ Sức khỏe của bạn xứng đáng với mọi nỗ lực!",
    "🎯 Hành trình ngàn dặm bắt đầu từ bước chân đầu tiên!",
    "🌱 Hãy trồng hạt giống sức khỏe cho tương lai!"
  ];

  const [currentQuote] = useState(motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)]);

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
      const endpoint = 'http://localhost:5000/api/auth/login';
      const loginPayload = {
        email: loginData.emailOrUsername,
        password: loginData.password
      };

      const response = await axios.post(endpoint, loginPayload);
      const { token, user } = response.data;

      if (
        (userType === 'member' && user.role !== 'member' && user.role !== 'guest') ||
        (userType === 'coach' && user.role !== 'coach') ||
        (userType === 'admin' && user.role !== 'admin')
      ) {
        setError('Tài khoản không đúng loại bạn đã chọn!');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      if (user.role === 'coach') {
        navigate('/coach-portal');
      } else if (user.role === 'admin') {
        navigate('/admin/users');
      } else {
        navigate('/');
      }
    } catch (error) {
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
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, 
          ${alpha('#4CAF50', 0.1)} 0%, 
          ${alpha('#2196F3', 0.1)} 50%, 
          ${alpha('#FF9800', 0.1)} 100%)`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: alpha('#4CAF50', 0.1),
          zIndex: 0
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-100px',
          left: '-100px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: alpha('#2196F3', 0.1),
          zIndex: 0
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container sx={{ minHeight: '100vh', alignItems: 'center' }}>
          {/* Left side - Welcome and motivation */}
          <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ pr: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: 'primary.main',
                    margin: '0 auto',
                    mb: 3,
                    boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`
                  }}
                >
                  <HealthIcon sx={{ fontSize: 60 }} />
                </Avatar>
                
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #4CAF50, #2196F3)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2
                  }}
                >
                  🚭 Cai Thuốc Lá
                </Typography>
                
                <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
                  Hệ thống hỗ trợ cai thuốc thông minh
                </Typography>
                
                <Chip
                  label={currentQuote}
                  sx={{
                    p: 2,
                    fontSize: '1.1rem',
                    height: 'auto',
                    bgcolor: alpha('#4CAF50', 0.1),
                    color: '#2E7D32',
                    border: `1px solid ${alpha('#4CAF50', 0.3)}`,
                    '& .MuiChip-label': {
                      whiteSpace: 'normal',
                      textAlign: 'center'
                    }
                  }}
                />
              </Box>

              {/* Benefits cards */}
              <Grid container spacing={2}>
                {[
                  { icon: <HeartIcon />, title: 'Sức khỏe', desc: 'Cải thiện sức khỏe tim mạch' },
                  { icon: <HappyIcon />, title: 'Hạnh phúc', desc: 'Tăng cường tinh thần tích cực' },
                  { icon: <ProgressIcon />, title: 'Tiến bộ', desc: 'Theo dõi quá trình cai thuốc' },
                  { icon: <MedicalIcon />, title: 'Hỗ trợ', desc: 'Tư vấn từ chuyên gia' }
                ].map((benefit, index) => (
                  <Grid item xs={6} key={index}>
                    <Card
                      sx={{
                        textAlign: 'center',
                        p: 2,
                        height: '100%',
                        transition: 'transform 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 4
                        }
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: alpha('#2196F3', 0.1),
                          color: '#1976D2',
                          margin: '0 auto',
                          mb: 1
                        }}
                      >
                        {benefit.icon}
                      </Avatar>
                      <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem', fontWeight: 600 }}>
                        {benefit.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {benefit.desc}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>

          {/* Right side - Login/Register form */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'center', px: 2 }}>
              <Paper
                elevation={24}
                sx={{
                  width: '100%',
                  maxWidth: 480,
                  p: 4,
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha('#fff', 0.2)}`,
                  boxShadow: `0 20px 60px ${alpha('#000', 0.15)}`
                }}
              >
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <IconButton 
                    onClick={() => navigate('/')}
                    sx={{ 
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      bgcolor: alpha('#4CAF50', 0.1),
                      color: '#4CAF50',
                      '&:hover': {
                        bgcolor: '#4CAF50',
                        color: 'white',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <HomeIcon />
                  </IconButton>
                  
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: 'primary.main',
                      margin: '0 auto',
                      mb: 2
                    }}
                  >
                    <LockIcon sx={{ fontSize: 30 }} />
                  </Avatar>
                  
                  <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {activeTab === 0 ? '🔐 Đăng nhập' : '📝 Đăng ký'}
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    {activeTab === 0 
                      ? 'Chào mừng bạn trở lại hành trình cai thuốc!'
                      : 'Bắt đầu hành trình cai thuốc cùng chúng tôi!'
                    }
                  </Typography>
                </Box>
                
                {/* Tabs */}
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange} 
                  centered 
                  sx={{ 
                    mb: 3,
                    '& .MuiTab-root': {
                      fontWeight: 600,
                      fontSize: '1rem'
                    }
                  }}
                >
                  <Tab label="Đăng nhập" />
                  <Tab label="Đăng ký" />
                </Tabs>

                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3, 
                      borderRadius: 2,
                      '& .MuiAlert-message': {
                        fontSize: '0.95rem'
                      }
                    }}
                  >
                    {error}
                  </Alert>
                )}

                {activeTab === 0 ? (
                  // Login Form
                  <Box component="form" onSubmit={handleLoginSubmit}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Loại tài khoản</InputLabel>
                      <Select
                        value={userType}
                        onChange={(e) => setUserType(e.target.value)}
                        label="Loại tài khoản"
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="member">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" />
                            Thành viên
                          </Box>
                        </MenuItem>
                        <MenuItem value="coach">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <MedicalIcon fontSize="small" />
                            Huấn luyện viên
                          </Box>
                        </MenuItem>
                        <MenuItem value="admin">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HealthIcon fontSize="small" />
                            Quản trị viên
                          </Box>
                        </MenuItem>
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
                      sx={{ 
                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                      }}
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
                            <EmailIcon />
                          </Box>
                        )
                      }}
                    />
                    
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      label="Mật khẩu"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={handleLoginInputChange}
                      error={!!loginErrors.password}
                      helperText={loginErrors.password}
                      disabled={loading}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                      }}
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
                            <LockIcon />
                          </Box>
                        ),
                        endAdornment: (
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        )
                      }}
                    />
                    
                    <Box sx={{ mt: 2, mb: 3, textAlign: 'right' }}>
                      <Link 
                        href="/forgot-password" 
                        variant="body2"
                        sx={{ 
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        Quên mật khẩu?
                      </Link>
                    </Box>
                    
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading}
                      sx={{ 
                        mt: 2, 
                        mb: 2, 
                        py: 1.5,
                        borderRadius: 2,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        background: 'linear-gradient(45deg, #4CAF50, #2196F3)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #45a049, #1976D2)',
                          transform: 'translateY(-2px)',
                          boxShadow: 6
                        }
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : '🚀 Đăng nhập'}
                    </Button>
                  </Box>
                ) : (
                  // Register Form
                  <Box component="form" onSubmit={handleRegisterSubmit}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
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
                          sx={{ 
                            '& .MuiOutlinedInput-root': { borderRadius: 2 }
                          }}
                          InputProps={{
                            startAdornment: (
                              <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
                                <PersonIcon />
                              </Box>
                            )
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
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
                          sx={{ 
                            '& .MuiOutlinedInput-root': { borderRadius: 2 }
                          }}
                          InputProps={{
                            startAdornment: (
                              <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
                                <PhoneIcon />
                              </Box>
                            )
                          }}
                        />
                      </Grid>
                    </Grid>
                    
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
                      sx={{ 
                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                      }}
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
                            <EmailIcon />
                          </Box>
                        )
                      }}
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
                      sx={{ 
                        '& .MuiOutlinedInput-root': { borderRadius: 2 }
                      }}
                      InputProps={{
                        startAdornment: (
                          <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
                            <AddressIcon />
                          </Box>
                        )
                      }}
                    />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          label="Mật khẩu"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={registerData.password}
                          onChange={handleRegisterInputChange}
                          error={!!registerErrors.password}
                          helperText={registerErrors.password}
                          disabled={loading}
                          sx={{ 
                            '& .MuiOutlinedInput-root': { borderRadius: 2 }
                          }}
                          InputProps={{
                            startAdornment: (
                              <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
                                <LockIcon />
                              </Box>
                            ),
                            endAdornment: (
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            )
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          label="Xác nhận mật khẩu"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={registerData.confirmPassword}
                          onChange={handleRegisterInputChange}
                          error={!!registerErrors.confirmPassword}
                          helperText={registerErrors.confirmPassword}
                          disabled={loading}
                          sx={{ 
                            '& .MuiOutlinedInput-root': { borderRadius: 2 }
                          }}
                          InputProps={{
                            startAdornment: (
                              <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
                                <LockIcon />
                              </Box>
                            ),
                            endAdornment: (
                              <IconButton
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                edge="end"
                              >
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            )
                          }}
                        />
                      </Grid>
                    </Grid>
                    
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading}
                      sx={{ 
                        mt: 3, 
                        mb: 2, 
                        py: 1.5,
                        borderRadius: 2,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        background: 'linear-gradient(45deg, #FF9800, #4CAF50)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #F57C00, #45a049)',
                          transform: 'translateY(-2px)',
                          boxShadow: 6
                        }
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : '🎯 Đăng ký ngay'}
                    </Button>
                  </Box>
                )}
                
                <Divider sx={{ my: 3 }}>
                  <Chip 
                    label="Bạn đã sẵn sàng cai thuốc chưa? 💪" 
                    sx={{ 
                      bgcolor: alpha('#4CAF50', 0.1),
                      color: '#2E7D32',
                      fontWeight: 600
                    }}
                  />
                </Divider>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default LoginPage; 