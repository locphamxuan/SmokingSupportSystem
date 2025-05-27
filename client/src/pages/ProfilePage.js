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
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  const [openDialog, setOpenDialog] = useState(false);
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
      
      console.log('=== FETCH USER DATA RESPONSE ===');
      console.log('Raw response data:');
      console.dir(response.data);
      
      // Đảm bảo smokingStatus có cấu trúc đầy đủ
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
      
      console.log('=== PROCESSED USER DATA ===');
      console.log('Processed smoking status:');
      console.table(userData.smokingStatus);
      console.dir(userData.smokingStatus);
      
      setUserData(userData);
    } catch (error) {
      setError('Unable to load user information. Please try again later.');
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
      setError('Please upgrade to Member account to use this feature');
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
      // Validate input
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
      setSuccess('Profile updated successfully!');
      setError('');
    } catch (error) {
      setError('Failed to update profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSmokingStatus = async () => {
    // Validate input
    const { cigarettesPerDay, costPerPack, smokingFrequency, healthStatus, cigaretteType, dailyLog } = userData.smokingStatus;
    if (
      cigarettesPerDay === undefined ||
      costPerPack === undefined ||
      smokingFrequency === undefined ||
      healthStatus === undefined ||
      cigaretteType === undefined ||
      dailyLog === undefined ||
      cigarettesPerDay === '' ||
      costPerPack === '' ||
      smokingFrequency === '' ||
      healthStatus === '' ||
      cigaretteType === ''
    ) {
      setError('Vui lòng nhập đầy đủ thông tin tình trạng hút thuốc.');
      return;
    }
    if (isNaN(Number(cigarettesPerDay)) || isNaN(Number(costPerPack))) {
      setError('Số điếu thuốc mỗi ngày và giá mỗi bao phải là số.');
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      console.log('=== SENDING SMOKING STATUS UPDATE ===');
      const dataToSend = {
        cigarettesPerDay: Number(cigarettesPerDay),
        costPerPack: Number(costPerPack),
        smokingFrequency: String(smokingFrequency),
        healthStatus: String(healthStatus),
        cigaretteType: String(cigaretteType || ''),
        dailyCigarettes: Number(dailyLog.cigarettes || 0),
        dailyFeeling: String(dailyLog.feeling || '')
      };
      console.log('Data to send:');
      console.table(dataToSend);
      console.dir(dataToSend);
      const response = await axios.put('http://localhost:5000/api/auth/smoking-status', dataToSend, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('=== UPDATE RESPONSE ===');
      console.log('Response status:', response.status);
      console.log('Response data:');
      console.dir(response.data);
      
      // Cập nhật state với dữ liệu vừa gửi để giữ lại trong form
      const updatedSmokingStatus = {
        cigarettesPerDay: Number(cigarettesPerDay),
        costPerPack: Number(costPerPack),
        smokingFrequency: String(smokingFrequency),
        healthStatus: String(healthStatus),
        cigaretteType: String(cigaretteType || ''),
        quitReason: userData.smokingStatus.quitReason || '',
        dailyLog: {
          cigarettes: Number(dailyLog.cigarettes || 0),
          feeling: String(dailyLog.feeling || '')
        }
      };
      
      console.log('=== UPDATING LOCAL STATE ===');
      console.log('New smoking status:');
      console.table(updatedSmokingStatus);
      console.dir(updatedSmokingStatus);
      
      setUserData(prevData => ({
        ...prevData,
        smokingStatus: updatedSmokingStatus
      }));
      
      setSuccess('Cập nhật tình trạng hút thuốc thành công!');
      setError('');
      
      console.log('=== FETCHING UPDATED DATA ===');
      // Fetch lại để đồng bộ với server
      await fetchUserData();
      console.log('=== UPDATE COMPLETED ===');
    } catch (error) {
      console.error('=== UPDATE ERROR ===');
      console.error('Error details:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to update smoking status. Please try again later.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        navigate('/login');
      } else if (error.response?.status === 500) {
        errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuitPlan = () => {
    setOpenDialog(true);
  };

  const handleSaveQuitPlan = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      await axios.post(
        'http://localhost:5000/api/auth/quit-plan',
        userData.quitPlan,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOpenDialog(false);
      setSuccess('Tạo kế hoạch cai thuốc thành công!');
      setError('');
      await fetchQuitPlan();
    } catch (error) {
      setError('Failed to create quit plan. Please try again later.');
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
                Back to Home
              </Button>
            </Box>
            
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
              Hồ sơ cá nhân
            </Typography>

            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
              <Tab label="Thông tin cá nhân" />
             
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
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tên người dùng"
                      value={userData.username}
                      onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                      margin="normal"
                      disabled={loading}
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      value={userData.email}
                      onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                      margin="normal"
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Số điện thoại"
                      value={userData.phoneNumber}
                      onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                      margin="normal"
                      disabled={loading}
                    />
                    <TextField
                      fullWidth
                      label="Địa chỉ"
                      value={userData.address}
                      onChange={(e) => setUserData({ ...userData, address: e.target.value })}
                      margin="normal"
                      disabled={loading}
                    />
                  </Grid>
                </Grid>
                <Button
                  variant="contained"
                  onClick={handleUpdateProfile}
                  sx={{ mt: 3 }}
                  disabled={loading}
                >
                  {loading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
                </Button>
              </Paper>
            )}


            

            

            {userData.role === 'guest' && !userData.isMember && (
              <Paper sx={{ p: 3, mt: 3, bgcolor: 'warning.light' }}>
                <Typography variant="h6" gutterBottom>
                  Nâng cấp lên Member
                </Typography>
                <Typography variant="body1" paragraph>
                  Nâng cấp lên tài khoản Premium để:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Tạo kế hoạch cai thuốc"
                      secondary="Tạo và theo dõi kế hoạch cai thuốc cá nhân"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Xem thành tích"
                      secondary="Theo dõi tiến trình và nhận huy hiệu"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Tư vấn từ huấn luyện viên"
                      secondary="Đặt câu hỏi và nhận tư vấn trực tuyến"
                    />
                  </ListItem>
                </List>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/subscription')}
                  sx={{ mt: 2 }}
                >
                  Nâng cấp ngay
                </Button>
              </Paper>
            )}

            {userData.isPremium && (
              <Paper sx={{ p: 3, mt: 3, bgcolor: 'primary.light' }}>
                <Typography variant="h6" gutterBottom>
                  Tính năng Premium
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Tư vấn từ huấn luyện viên"
                      secondary="Đặt câu hỏi và nhận tư vấn trực tuyến"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Báo cáo chi tiết"
                      secondary="Xem các báo cáo nâng cao về quá trình cai thuốc"
                    />
                  </ListItem>
                </List>
              </Paper>
            )}
          </Box>
        </Container>
      </Box>

      {/* Full-width Footer with contact information */}
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