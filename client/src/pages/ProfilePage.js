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
  IconButton,
  Divider
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
    isPremium: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(response.data);
    } catch (error) {
      setError('Unable to load user information. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleTabChange = (event, newValue) => {
    if (!userData.isPremium && (newValue === 2 || newValue === 3)) {
      setError('Please upgrade to Premium account to use this feature');
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
      await axios.put('/api/auth/profile', userData, {
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
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put('/api/auth/smoking-status', {
        cigarettesPerDay: userData.smokingStatus.cigarettesPerDay,
        costPerPack: userData.smokingStatus.costPerPack,
        smokingFrequency: userData.smokingStatus.smokingFrequency,
        healthStatus: userData.smokingStatus.healthStatus,
        quitReason: userData.smokingStatus.quitReason,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Smoking status updated successfully!');
      setError('');
    } catch (error) {
      setError('Failed to update smoking status. Please try again later.');
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
      await axios.post('/api/auth/quit-plan', userData.quitPlan, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpenDialog(false);
      setSuccess('Quit plan created successfully!');
      setError('');
      fetchUserData(); // Refresh data after creating new plan
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <IconButton 
                onClick={() => navigate('/')} 
                sx={{ mr: 2 }}
                aria-label="back to home"
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" gutterBottom>
                Hồ sơ cá nhân
              </Typography>
            </Box>

            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
              <Tab label="Thông tin cá nhân" />
              <Tab label="Tình trạng hút thuốc" />
              <Tab 
                label="Kế hoạch cai thuốc" 
                disabled={!userData.isPremium}
                sx={{ 
                  opacity: userData.isPremium ? 1 : 0.5,
                  '&.Mui-disabled': {
                    color: 'text.secondary'
                  }
                }}
              />
              <Tab 
                label="Thành tích" 
                disabled={!userData.isPremium}
                sx={{ 
                  opacity: userData.isPremium ? 1 : 0.5,
                  '&.Mui-disabled': {
                    color: 'text.secondary'
                  }
                }}
              />
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

            {activeTab === 1 && (
              <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Số điếu thuốc mỗi ngày"
                      value={userData.smokingStatus.cigarettesPerDay}
                      onChange={(e) => setUserData({
                        ...userData,
                        smokingStatus: {
                          ...userData.smokingStatus,
                          cigarettesPerDay: e.target.value
                        }
                      })}
                      margin="normal"
                      disabled={loading}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      label="Giá mỗi bao (VNĐ)"
                      value={userData.smokingStatus.costPerPack}
                      onChange={(e) => setUserData({
                        ...userData,
                        smokingStatus: {
                          ...userData.smokingStatus,
                          costPerPack: e.target.value
                        }
                      })}
                      margin="normal"
                      disabled={loading}
                    />
                    <TextField
                      fullWidth
                      label="Loại thuốc lá"
                      value={userData.smokingStatus.cigaretteType || ''}
                      onChange={(e) => setUserData({
                        ...userData,
                        smokingStatus: {
                          ...userData.smokingStatus,
                          cigaretteType: e.target.value
                        }
                      })}
                      margin="normal"
                      disabled={loading}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tần suất hút thuốc"
                      value={userData.smokingStatus.smokingFrequency}
                      onChange={(e) => setUserData({
                        ...userData,
                        smokingStatus: {
                          ...userData.smokingStatus,
                          smokingFrequency: e.target.value
                        }
                      })}
                      margin="normal"
                      disabled={loading}
                    />
                    <TextField
                      fullWidth
                      label="Tình trạng sức khỏe"
                      value={userData.smokingStatus.healthStatus}
                      onChange={(e) => setUserData({
                        ...userData,
                        smokingStatus: {
                          ...userData.smokingStatus,
                          healthStatus: e.target.value
                        }
                      })}
                      margin="normal"
                      disabled={loading}
                    />
                    <TextField
                      fullWidth
                      label="Lý do muốn cai thuốc"
                      value={userData.smokingStatus.quitReason || ''}
                      onChange={(e) => setUserData({
                        ...userData,
                        smokingStatus: {
                          ...userData.smokingStatus,
                          quitReason: e.target.value
                        }
                      })}
                      margin="normal"
                      multiline
                      rows={3}
                      disabled={loading}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Nhật ký hút thuốc hôm nay
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Số điếu đã hút hôm nay"
                        value={userData.smokingStatus.dailyLog?.cigarettes || 0}
                        onChange={(e) => setUserData({
                          ...userData,
                          smokingStatus: {
                            ...userData.smokingStatus,
                            dailyLog: {
                              ...userData.smokingStatus.dailyLog,
                              cigarettes: e.target.value
                            }
                          }
                        })}
                        margin="normal"
                        disabled={loading}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Cảm nhận"
                        value={userData.smokingStatus.dailyLog?.feeling || ''}
                        onChange={(e) => setUserData({
                          ...userData,
                          smokingStatus: {
                            ...userData.smokingStatus,
                            dailyLog: {
                              ...userData.smokingStatus.dailyLog,
                              feeling: e.target.value
                            }
                          }
                        })}
                        margin="normal"
                        multiline
                        rows={2}
                        disabled={loading}
                      />
                    </Grid>
                  </Grid>
                </Box>
                <Button
                  variant="contained"
                  onClick={handleUpdateSmokingStatus}
                  sx={{ mt: 3 }}
                  disabled={loading}
                >
                  {loading ? 'Đang cập nhật...' : 'Cập nhật tình trạng'}
                </Button>
              </Paper>
            )}

            {activeTab === 2 && userData.isPremium && (
              <Paper sx={{ p: 3 }}>
                {userData.quitPlan.startDate ? (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Kế hoạch cai thuốc hiện tại
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography>
                          Ngày bắt đầu: {new Date(userData.quitPlan.startDate).toLocaleDateString()}
                        </Typography>
                        <Typography>
                          Mục tiêu: {new Date(userData.quitPlan.targetDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1">Tiến độ</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={userData.quitPlan.currentProgress}
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {userData.quitPlan.currentProgress}%
                        </Typography>
                      </Grid>
                    </Grid>
                    <List>
                      {userData.quitPlan.milestones.map((milestone, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={milestone.title}
                            secondary={milestone.date}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleCreateQuitPlan}
                    sx={{ mt: 2 }}
                    disabled={loading}
                  >
                    Tạo kế hoạch cai thuốc mới
                  </Button>
                )}
              </Paper>
            )}

            {activeTab === 3 && userData.isPremium && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Huy hiệu và thành tích
                </Typography>
                <Grid container spacing={2}>
                  {userData.achievements.map((achievement, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6">{achievement.title}</Typography>
                          <Typography color="textSecondary">
                            {achievement.description}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Đạt được: {new Date(achievement.date).toLocaleDateString()}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button size="small">Chia sẻ</Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {!userData.isPremium && (
              <Paper sx={{ p: 3, mt: 3, bgcolor: 'warning.light' }}>
                <Typography variant="h6" gutterBottom>
                  Nâng cấp lên Premium
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
                      secondary="Theo dõi tiến độ và nhận huy hiệu"
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Tạo kế hoạch cai thuốc mới</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Chọn kế hoạch cai thuốc
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: userData.quitPlan.planType === 'gradual' ? '2px solid #4caf50' : '1px solid #ddd'
                  }}
                  onClick={() => setUserData({
                    ...userData,
                    quitPlan: {
                      ...userData.quitPlan,
                      planType: 'gradual'
                    }
                  })}
                >
                  <CardContent>
                    <Typography variant="h6">Giảm dần</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Giảm số lượng điếu thuốc mỗi ngày trong 2 tuần
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: userData.quitPlan.planType === 'cold-turkey' ? '2px solid #4caf50' : '1px solid #ddd'
                  }}
                  onClick={() => setUserData({
                    ...userData,
                    quitPlan: {
                      ...userData.quitPlan,
                      planType: 'cold-turkey'
                    }
                  })}
                >
                  <CardContent>
                    <Typography variant="h6">Bỏ ngay</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ngừng hút thuốc ngay lập tức
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: userData.quitPlan.planType === 'custom' ? '2px solid #4caf50' : '1px solid #ddd'
                  }}
                  onClick={() => setUserData({
                    ...userData,
                    quitPlan: {
                      ...userData.quitPlan,
                      planType: 'custom'
                    }
                  })}
                >
                  <CardContent>
                    <Typography variant="h6">Tùy chỉnh</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tạo kế hoạch riêng phù hợp với bạn
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          <TextField
            fullWidth
            type="date"
            label="Ngày bắt đầu"
            value={userData.quitPlan.startDate}
            onChange={(e) => setUserData({
              ...userData,
              quitPlan: {
                ...userData.quitPlan,
                startDate: e.target.value
              }
            })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            disabled={loading}
          />
          <TextField
            fullWidth
            type="date"
            label="Ngày mục tiêu"
            value={userData.quitPlan.targetDate}
            onChange={(e) => setUserData({
              ...userData,
              quitPlan: {
                ...userData.quitPlan,
                targetDate: e.target.value
              }
            })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            disabled={loading}
          />

          {userData.quitPlan.planType === 'gradual' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Kế hoạch giảm dần
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Số điếu ban đầu mỗi ngày"
                    value={userData.quitPlan.initialCigarettes || userData.smokingStatus.cigarettesPerDay}
                    onChange={(e) => setUserData({
                      ...userData,
                      quitPlan: {
                        ...userData.quitPlan,
                        initialCigarettes: e.target.value
                      }
                    })}
                    margin="normal"
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Số điếu giảm mỗi ngày"
                    value={userData.quitPlan.dailyReduction || 1}
                    onChange={(e) => setUserData({
                      ...userData,
                      quitPlan: {
                        ...userData.quitPlan,
                        dailyReduction: e.target.value
                      }
                    })}
                    margin="normal"
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Mốc quan trọng
            </Typography>
            <List>
              {[
                { title: '1 ngày không hút thuốc', days: 1 },
                { title: '1 tuần không hút thuốc', days: 7 },
                { title: '1 tháng không hút thuốc', days: 30 },
                { title: '3 tháng không hút thuốc', days: 90 },
                { title: '6 tháng không hút thuốc', days: 180 },
                { title: '1 năm không hút thuốc', days: 365 }
              ].map((milestone, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={milestone.title}
                    secondary={`Tiết kiệm được ${(milestone.days * userData.smokingStatus.cigarettesPerDay * userData.smokingStatus.costPerPack / 20).toLocaleString()} VNĐ`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSaveQuitPlan} variant="contained" disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo kế hoạch'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePage; 