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
  IconButton
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
      healthStatus: ''
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
      setError('Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleTabChange = (event, newValue) => {
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
      setSuccess('Cập nhật thông tin thành công!');
      setError('');
    } catch (error) {
      setError('Cập nhật thông tin thất bại. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSmokingStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put('/api/auth/smoking-status', userData.smokingStatus, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Cập nhật tình trạng hút thuốc thành công!');
      setError('');
    } catch (error) {
      setError('Cập nhật tình trạng hút thuốc thất bại. Vui lòng thử lại sau.');
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
      setSuccess('Tạo kế hoạch cai thuốc thành công!');
      setError('');
      fetchUserData(); // Refresh data after creating new plan
    } catch (error) {
      setError('Tạo kế hoạch cai thuốc thất bại. Vui lòng thử lại sau.');
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
          <Tab label="Kế hoạch cai thuốc" />
          <Tab label="Thành tích" />
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
                  label="Số điếu thuốc/ngày"
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
                  label="Chi phí/gói (VNĐ)"
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
              </Grid>
            </Grid>
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

        {activeTab === 2 && (
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

        {activeTab === 3 && (
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Tạo kế hoạch cai thuốc mới</DialogTitle>
        <DialogContent>
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
    </Container>
  );
};

export default ProfilePage; 