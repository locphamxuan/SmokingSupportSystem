import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Paper, Typography, Grid, TextField, Button, Box, LinearProgress, List, ListItem, ListItemText, Snackbar, Alert, Dialog
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MyProgressPage = () => {
  const [userData, setUserData] = useState({
    smokingStatus: {
      cigarettesPerDay: 0,
      costPerPack: 0,
      smokingFrequency: '',
      healthStatus: '',
      cigaretteType: '',
      quitReason: '',
      dailyLog: { cigarettes: 0, feeling: '' }
    },
    quitPlan: null,
    role: 'guest'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

  // Fetch all user data
  const fetchAllUserData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      // Gọi song song 2 API
      const [profileRes, quitPlanRes] = await Promise.all([
        axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/auth/quit-plan', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setUserData({
        ...profileRes.data,
        smokingStatus: {
          cigarettesPerDay: profileRes.data.smokingStatus?.cigarettesPerDay || 0,
          costPerPack: profileRes.data.smokingStatus?.costPerPack || 0,
          smokingFrequency: profileRes.data.smokingStatus?.smokingFrequency || '',
          healthStatus: profileRes.data.smokingStatus?.healthStatus || '',
          cigaretteType: profileRes.data.smokingStatus?.cigaretteType || '',
          quitReason: profileRes.data.smokingStatus?.quitReason || '',
          dailyLog: {
            cigarettes: profileRes.data.smokingStatus?.dailyLog?.cigarettes || 0,
            feeling: profileRes.data.smokingStatus?.dailyLog?.feeling || ''
          }
        },
        quitPlan: quitPlanRes.data.quitPlan || null
      });
    } catch (error) {
      setError('Không thể tải thông tin người dùng hoặc kế hoạch.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAllUserData();
  }, [fetchAllUserData]);

  // Update smoking status
  const handleUpdateSmokingStatus = async () => {
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
      await axios.put('http://localhost:5000/api/auth/smoking-status', {
        cigarettesPerDay: Number(cigarettesPerDay),
        costPerPack: Number(costPerPack),
        smokingFrequency: String(smokingFrequency),
        healthStatus: String(healthStatus),
        cigaretteType: String(cigaretteType || ''),
        dailyCigarettes: Number(dailyLog.cigarettes || 0),
        dailyFeeling: String(dailyLog.feeling || '')
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Cập nhật tình trạng hút thuốc thành công!');
      setError('');
      await fetchAllUserData();
    } catch (error) {
      setError('Lỗi khi cập nhật tình trạng hút thuốc.');
    } finally {
      setLoading(false);
    }
  };

  // Quit plan
  const handleCreateQuitPlan = () => {
    setUserData(prev => ({
      ...prev,
      quitPlan: {
        startDate: '',
        targetDate: '',
        planType: '',
        initialCigarettes: 0,
        dailyReduction: 1,
        milestones: [],
        currentProgress: 0
      }
    }));
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
      const plan = {
        startDate: userData.quitPlan.startDate,
        targetDate: userData.quitPlan.targetDate,
        planType: userData.quitPlan.planType,
        initialCigarettes: userData.quitPlan.initialCigarettes || 0,
        dailyReduction: userData.quitPlan.dailyReduction || 1,
        milestones: userData.quitPlan.milestones || [],
        currentProgress: userData.quitPlan.currentProgress || 0,
        planDetail: userData.quitPlan.planDetail || ''
      };
      if (!plan.startDate || !plan.targetDate || !plan.planType) {
        setError('Vui lòng nhập đầy đủ thông tin kế hoạch!');
        setLoading(false);
        return;
      }
      await axios.post(
        'http://localhost:5000/api/auth/quit-plan',
        plan,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOpenDialog(false);
      setSuccess('Tạo/cập nhật kế hoạch cai thuốc thành công!');
      setError('');
      await fetchAllUserData();
    } catch (error) {
      setError(error.response?.data?.message || 'Lỗi khi tạo/cập nhật kế hoạch cai thuốc.');
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
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1976d2', mt: 4 }}>
        Theo dõi quá trình cai thuốc
      </Typography>
      <Snackbar open={!!error || !!success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={error ? 'error' : 'success'} sx={{ width: '100%' }}>
          {error || success}
        </Alert>
      </Snackbar>
      {/* Tình trạng hút thuốc */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Tình trạng hút thuốc
        </Typography>
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
      {/* Kế hoạch cai thuốc */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Kế hoạch cai thuốc
        </Typography>
        {userData.quitPlan && userData.quitPlan.startDate ? (
          <>
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
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateQuitPlan}
              sx={{ mt: 2 }}
              disabled={loading}
            >
              Cập nhật kế hoạch
            </Button>
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
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <Box sx={{ p: 3, minWidth: 350 }}>
          <Typography variant="h6" gutterBottom>
            Nhập thông tin kế hoạch cai thuốc
          </Typography>
          <TextField
            fullWidth
            label="Ngày bắt đầu"
            type="date"
            value={userData.quitPlan?.startDate || ''}
            onChange={e =>
              setUserData(prev => ({
                ...prev,
                quitPlan: { ...prev.quitPlan, startDate: e.target.value }
              }))
            }
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Ngày mục tiêu"
            type="date"
            value={userData.quitPlan?.targetDate || ''}
            onChange={e =>
              setUserData(prev => ({
                ...prev,
                quitPlan: { ...prev.quitPlan, targetDate: e.target.value }
              }))
            }
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Loại kế hoạch (suggested/custom)"
            value={userData.quitPlan?.planType || ''}
            onChange={e =>
              setUserData(prev => ({
                ...prev,
                quitPlan: { ...prev.quitPlan, planType: e.target.value }
              }))
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Số điếu ban đầu"
            type="number"
            value={userData.quitPlan?.initialCigarettes || 0}
            onChange={e =>
              setUserData(prev => ({
                ...prev,
                quitPlan: { ...prev.quitPlan, initialCigarettes: e.target.value }
              }))
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Giảm mỗi ngày"
            type="number"
            value={userData.quitPlan?.dailyReduction || 1}
            onChange={e =>
              setUserData(prev => ({
                ...prev,
                quitPlan: { ...prev.quitPlan, dailyReduction: e.target.value }
              }))
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Chi tiết kế hoạch"
            value={userData.quitPlan?.planDetail || ''}
            onChange={e =>
              setUserData(prev => ({
                ...prev,
                quitPlan: { ...prev.quitPlan, planDetail: e.target.value }
              }))
            }
            margin="normal"
            multiline
            rows={3}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={() => setOpenDialog(false)} sx={{ mr: 1 }}>
              Hủy
            </Button>
            <Button variant="contained" onClick={handleSaveQuitPlan}>
              Lưu kế hoạch
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Container>
  );
};

export default MyProgressPage;