import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Tabs,
  Tab,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Alert,
  Snackbar,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    address: '',
    smokingStatus: {
      cigarettesPerDay: 0,
      costPerPack: 0,
      smokingFrequency: '',
      healthStatus: '',
      cigaretteType: '',
      quitReason: '',
      dailyLog: {
        cigarettes: 0,
        feeling: ''
      }
    },
    quitPlan: {
      startDate: '',
      targetDate: '',
      milestones: [],
      currentProgress: 0
    },
    achievements: [],
    role: 'guest'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userData = {
        ...response.data,
        smokingStatus: {
          cigarettesPerDay: response.data.smokingStatus?.cigarettesPerDay || 0,
          costPerPack: response.data.smokingStatus?.costPerPack || 0,
          smokingFrequency: response.data.smokingStatus?.smokingFrequency || '',
          healthStatus: response.data.smokingStatus?.healthStatus || '',
          cigaretteType: response.data.smokingStatus?.cigaretteType || '',
          quitReason: response.data.smokingStatus?.quitReason || '',
          dailyLog: {
            cigarettes: response.data.smokingStatus?.dailyLog?.cigarettes || 0,
            feeling: response.data.smokingStatus?.dailyLog?.feeling || ''
          }
        }
      };
      
      setUserData(userData);
    } catch (error) {
      console.error("Lỗi khi tải thông tin người dùng:", error);
      setError('Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchQuitPlan = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('http://localhost:5000/api/auth/quit-plan', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(prev => ({
        ...prev,
        quitPlan: res.data.quitPlan || null
      }));
    } catch (error) {
      console.error("Lỗi khi tải kế hoạch cai thuốc:", error);
      setUserData(prev => ({
        ...prev,
        quitPlan: null
      }));
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchQuitPlan();
  }, [fetchUserData]);

  useEffect(() => {
    if (user && user.role === "admin") {
      navigate("/admin/users");
    }
  }, [user, navigate]);

  const handleTabChange = (event, newValue) => {
    if (userData.role === 'guest' && (newValue === 2 || newValue === 3)) {
      setError('Vui lòng nâng cấp tài khoản thành viên để sử dụng tính năng này.');
      return;
    }
    setActiveTab(newValue);
    setError('');
    setSuccess('');
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      if (!userData.username || !userData.email) {
        setError('Vui lòng nhập đầy đủ tên đăng nhập và email.');
        setLoading(false);
        return;
      }
      await axios.put('http://localhost:5000/api/auth/profile', {
        username: userData.username,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        address: userData.address
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Hồ sơ đã được cập nhật thành công!');
      setError('');
    } catch (error) {
      console.error("Lỗi khi cập nhật hồ sơ:", error);
      setError(error.response?.data?.message || 'Cập nhật hồ sơ thất bại. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess('');
    setError('');
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh'
    }}>
      <Box sx={{ flexGrow: 1 }}>
        <Container maxWidth="lg">
          <Box sx={{ my: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Button 
                onClick={() => navigate('/')} 
                startIcon={<ArrowBackIcon />}
                sx={{ 
                  mr: 2,
                  color: '#1976d2',
                  borderColor: '#1976d2',
                  fontWeight: 500,
                  padding: '8px 16px',
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#1976d2',
                    color: 'white',
                    transform: 'translateX(-2px)',
                    transition: 'all 0.2s ease'
                  }
                }}
                variant="outlined"
                size="medium"
              >
                Quay lại trang chủ
              </Button>
            </Box>
            
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
              Hồ sơ cá nhân
            </Typography>

            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
              <Tab label="Thông tin cá nhân" />
              {userData.role !== 'coach' && userData.role !== 'admin' && (
                <>
                  <Tab label="Kế hoạch Cai thuốc" />
                  <Tab label="Thành tích" />
                </>
              )}
            </Tabs>

            <Snackbar
              open={!!error || !!success}
              autoHideDuration={6000}
              onClose={handleCloseSnackbar}
            >
              <Alert
                onClose={handleCloseSnackbar}
                severity={error ? 'error' : 'success'}
                sx={{ width: '100%' }}
              >
                {error || success}
              </Alert>
            </Snackbar>

            {activeTab === 0 && (
              <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Tên đăng nhập"
                      fullWidth
                      value={userData.username}
                      onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email"
                      fullWidth
                      value={userData.email}
                      onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                      margin="normal"
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Số điện thoại"
                      fullWidth
                      value={userData.phoneNumber}
                      onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Địa chỉ"
                      fullWidth
                      value={userData.address}
                      onChange={(e) => setUserData({ ...userData, address: e.target.value })}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button variant="contained" color="primary" onClick={handleUpdateProfile} disabled={loading}>
                      Cập nhật Profile
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {activeTab === 1 && userData.role !== 'coach' && userData.role !== 'admin' && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Kế hoạch Cai thuốc của bạn</Typography>
                {!userData.quitPlan ? (
                  <Box sx={{ textAlign: 'center', mt: 3, p: 2, border: '1px dashed #ccc', borderRadius: 2 }}>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      Bạn chưa có kế hoạch cai thuốc. Hãy tạo một kế hoạch để bắt đầu hành trình của mình!
                    </Typography>
                    <Button variant="contained" color="primary" onClick={() => {
                      setUserData(prev => ({ ...prev, quitPlan: { startDate: '', targetDate: '', milestones: [], currentProgress: 0 } }));
                    }}>
                      Tạo Kế hoạch Cai thuốc
                    </Button>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Ngày bắt đầu"
                        type="date"
                        fullWidth
                        value={userData.quitPlan.startDate}
                        onChange={(e) => setUserData(prev => ({
                          ...prev,
                          quitPlan: { ...prev.quitPlan, startDate: e.target.value }
                        }))}
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Ngày mục tiêu"
                        type="date"
                        fullWidth
                        value={userData.quitPlan.targetDate}
                        onChange={(e) => setUserData(prev => ({
                          ...prev,
                          quitPlan: { ...prev.quitPlan, targetDate: e.target.value }
                        }))}
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Số điếu ban đầu"
                        type="number"
                        fullWidth
                        value={userData.quitPlan.initialCigarettes}
                        onChange={(e) => setUserData(prev => ({
                          ...prev,
                          quitPlan: { ...prev.quitPlan, initialCigarettes: Number(e.target.value) }
                        }))}
                        margin="normal"
                        InputProps={{ inputProps: { min: 0 } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
                        Tiến độ hiện tại: {userData.quitPlan.currentProgress.toFixed(2)}%
                      </Typography>
                      <LinearProgress variant="determinate" value={userData.quitPlan.currentProgress} sx={{ height: 10, borderRadius: 5, mt: 1 }} />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Các mốc quan trọng:</Typography>
                      <List>
                        {userData.quitPlan.milestones.length === 0 ? (
                          <ListItem><ListItemText primary="Chưa có mốc quan trọng nào." /></ListItem>
                        ) : (
                          userData.quitPlan.milestones.map((milestone, index) => (
                            <ListItem key={index} divider>
                              <ListItemText primary={milestone.title} secondary={milestone.date} />
                            </ListItem>
                          ))
                        )}
                      </List>
                      <Button variant="outlined" size="small" sx={{ mt: 2 }}>Thêm Mốc mới</Button>
                    </Grid>
                  </Grid>
                )}
              </Paper>
            )}

            {activeTab === 2 && userData.role !== 'coach' && userData.role !== 'admin' && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Thành tích của bạn</Typography>
                {userData.achievements.length === 0 ? (
                  <Typography>Bạn chưa có thành tích nào. Hãy tiếp tục cố gắng!</Typography>
                ) : (
                  <List>
                    {userData.achievements.map((achievement, index) => (
                      <ListItem key={index} divider>
                        <ListItemText primary={achievement.title} secondary={achievement.date} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            )}
          </Box>
        </Container>
      </Box>

      <Box 
        component="footer" 
        sx={{ 
          py: 4, 
          backgroundColor: '#1e3a8a', 
          textAlign: 'center',
          width: '100%',
          left: 0,
          right: 0,
          borderTop: '1px solid #2563eb',
          color: 'white',
          boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#60a5fa' }}>
            Nền tảng hỗ trợ cai nghiện thuốc lá
          </Typography>
          
          <Divider sx={{ my: 2, mx: 'auto', width: '50%', borderColor: 'rgba(255,255,255,0.2)' }} />
          
          <Box sx={{ my: 2 }}>
            <Typography variant="body1" gutterBottom sx={{ color: '#e5e7eb' }}>
              <strong style={{ color: '#93c5fd' }}>Hotline:</strong> 1800-8888-77
            </Typography>
            <Typography variant="body1" gutterBottom sx={{ color: '#e5e7eb' }}>
              <strong style={{ color: '#93c5fd' }}>Email:</strong> support@smokingsupport.com
            </Typography>
            <Typography variant="body1" gutterBottom sx={{ color: '#e5e7eb' }}>
              <strong style={{ color: '#93c5fd' }}>Website:</strong> www.smokingsupport.com
            </Typography>
          </Box>
          
          <Typography variant="body2" color="#bfdbfe" sx={{ mt: 2 }}>
            © 2025 Smoking Support Platform. Mọi quyền được bảo lưu.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default ProfilePage; 
