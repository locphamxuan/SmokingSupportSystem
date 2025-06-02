import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container, Paper, Typography, Grid, TextField, Button, Box, LinearProgress, List, ListItem, ListItemText, Snackbar, Alert, Dialog, Chip
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
  const [autoSaveStatus, setAutoSaveStatus] = useState(''); // 'saving', 'saved', 'error'
  const navigate = useNavigate();
  
  // Refs for debouncing
  const debounceTimeoutRef = useRef(null);
  const lastSavedDataRef = useRef(null);

  // Enhanced setUserData with auto-save
  const setUserDataWithAutoSave = useCallback((newData) => {
    setUserData(prevUserData => {
      const updatedData = typeof newData === 'function' ? newData(prevUserData) : newData;
      
      // Save to localStorage immediately
      try {
        localStorage.setItem('myProgressData', JSON.stringify(updatedData));
        console.log('✅ Data saved to localStorage');
      } catch (error) {
        console.error('❌ Failed to save to localStorage:', error);
      }
      
      // Debounced save to server
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          // Kiểm tra xem dữ liệu có thay đổi không
          if (JSON.stringify(updatedData) === JSON.stringify(lastSavedDataRef.current)) {
            return;
          }

          setAutoSaveStatus('saving');
          const token = localStorage.getItem('token');
          if (!token) return;

          // Tụ động lưu trạng thái hút thuốc
          await axios.put('http://localhost:5000/api/auth/smoking-status', {
            cigarettesPerDay: Number(updatedData.smokingStatus.cigarettesPerDay),
            costPerPack: Number(updatedData.smokingStatus.costPerPack),
            smokingFrequency: String(updatedData.smokingStatus.smokingFrequency),
            healthStatus: String(updatedData.smokingStatus.healthStatus),
            cigaretteType: String(updatedData.smokingStatus.cigaretteType || ''),
            dailyCigarettes: Number(updatedData.smokingStatus.dailyLog?.cigarettes || 0),
            dailyFeeling: String(updatedData.smokingStatus.dailyLog?.feeling || '')
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          lastSavedDataRef.current = JSON.parse(JSON.stringify(updatedData));
          setAutoSaveStatus('saved');
          console.log('💾 Auto-saved to server successfully');
          
          // XÓa và lưu status sau 2 giây
          setTimeout(() => setAutoSaveStatus(''), 2000);
        } catch (error) {
          console.error('❌ Auto-save failed:', error);
          setAutoSaveStatus('error');
          setTimeout(() => setAutoSaveStatus(''), 3000);
        }
      }, 2000); // 2 second delay
      
      return updatedData;
    });
  }, []);

  // Fetch all user data
  const fetchAllUserData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      console.log('🔄 Fetching user data from server...');

      // Fetch from server first to get latest data
      const [profileRes, quitPlanRes] = await Promise.all([
        axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/auth/quit-plan', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { quitPlan: null } })) // Handle quit plan not found
      ]);
      
      console.log('📥 Profile data received:', profileRes.data);
      console.log('📥 Quit plan data received:', quitPlanRes.data);
      
      const serverData = {
        id: profileRes.data.id,
        username: profileRes.data.username,
        email: profileRes.data.email,
        phoneNumber: profileRes.data.phoneNumber,
        address: profileRes.data.address,
        role: profileRes.data.role,
        isMember: profileRes.data.isMember,
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
      };

      console.log('📊 Processed server data:', serverData);
      console.log('🚭 Smoking status:', serverData.smokingStatus);

      setUserData(serverData);
      lastSavedDataRef.current = JSON.parse(JSON.stringify(serverData));
      
      // Save to localStorage
      try {
        localStorage.setItem('myProgressData', JSON.stringify(serverData));
        console.log('✅ Data saved to localStorage');
      } catch (error) {
        console.error('❌ Failed to save to localStorage:', error);
      }

      const progressRes = await axios.get('http://localhost:5000/api/auth/progress/latest', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Khi setUserData, cập nhật luôn dailyLog nếu có progress mới nhất
      if (progressRes.data.progress) {
        setUserData(prev => ({
          ...prev,
          smokingStatus: {
            ...prev.smokingStatus,
            dailyLog: {
              cigarettes: progressRes.data.progress.Cigarettes,
              feeling: progressRes.data.progress.Note
            }
          }
        }));
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      setError('Không thể tải thông tin người dùng hoặc kế hoạch.');
      
      // Try to load from localStorage as fallback
      try {
        const savedData = localStorage.getItem('myProgressData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log('📥 Loaded fallback data from localStorage:', parsedData);
          setUserData(parsedData);
        }
      } catch (localError) {
        console.error('❌ Failed to load from localStorage:', localError);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAllUserData();
    
    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [fetchAllUserData]);

  // Quit plan
  const handleCreateQuitPlan = () => {
    setUserDataWithAutoSave(prev => ({
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

  const handleSaveProgress = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      // Lấy planId từ kế hoạch cai thuốc hiện tại (nếu có)
      const planId = userData.quitPlan?.id || userData.quitPlan?.planId || 1; // hoặc lấy đúng id từ quitPlan
      const date = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
      const cigarettes = Number(userData.smokingStatus.dailyLog.cigarettes || 0);
      const moneySpent = ((userData.smokingStatus.dailyLog.cigarettes / 20) * userData.smokingStatus.costPerPack) || 0;
      const note = userData.smokingStatus.dailyLog.feeling || '';

      await axios.post('http://localhost:5000/api/auth/progress', {
        planId,
        date,
        cigarettes,
        moneySpent,
        note
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Lưu nhật ký tiến độ thành công!');
      setError('');
      // Có thể gọi lại fetchAllUserData() nếu muốn cập nhật giao diện
    } catch (error) {
      setError('Lỗi khi lưu nhật ký tiến độ!');
    } finally {
      setLoading(false);
    }
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
          Theo dõi quá trình cai thuốc
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Refresh button */}
          <Button
            variant="outlined"
            onClick={fetchAllUserData}
            disabled={loading}
            sx={{ 
              minWidth: 120,
              '&:hover': {
                backgroundColor: '#1976d2',
                color: 'white'
              }
            }}
          >
            {loading ? 'Đang tải...' : '🔄 Tải lại'}
          </Button>
          
          {/* Auto-save status indicator */}
          {autoSaveStatus && (
            <Chip
              label={
                autoSaveStatus === 'saving' ? 'Đang lưu...' :
                autoSaveStatus === 'saved' ? 'Đã lưu tự động' :
                autoSaveStatus === 'error' ? 'Lỗi lưu tự động' : ''
              }
              color={
                autoSaveStatus === 'saving' ? 'info' :
                autoSaveStatus === 'saved' ? 'success' :
                autoSaveStatus === 'error' ? 'error' : 'default'
              }
              size="small"
              sx={{ 
                animation: autoSaveStatus === 'saving' ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 }
                }
              }}
            />
          )}
        </Box>
      </Box>
      
      <Snackbar open={!!error || !!success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={error ? 'error' : 'success'} sx={{ width: '100%' }}>
          {error || success}
        </Alert>
      </Snackbar>
      
      {/* Hiển thị thông tin hiện tại từ database */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
          👤 Thông tin tài khoản
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Tên đăng nhập:</Typography>
              <Typography variant="h6" color="primary">{userData.username}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Email:</Typography>
              <Typography variant="h6" color="primary">{userData.email}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Vai trò:</Typography>
              <Chip 
                label={userData.role === 'admin' ? 'Quản trị viên' : userData.role === 'member' ? 'Thành viên' : userData.role === 'coach' ? 'Huấn luyện viên' : 'Khách'}
                color={userData.role === 'admin' ? 'error' : userData.role === 'member' ? 'success' : userData.role === 'coach' ? 'info' : 'default'}
                size="small"
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Trạng thái thành viên:</Typography>
              <Chip 
                label={userData.isMember ? 'Premium' : 'Miễn phí'}
                color={userData.isMember ? 'success' : 'default'}
                size="small"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Hiển thị thông tin tình trạng hút thuốc từ database */}
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
          📊 Thông tin tình trạng hút thuốc của bạn
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Số điếu thuốc/ngày:</Typography>
              <Typography variant="h6" color="primary">{userData.smokingStatus.cigarettesPerDay} điếu</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Chi phí/gói:</Typography>
              <Typography variant="h6" color="primary">{userData.smokingStatus.costPerPack.toLocaleString()} VNĐ</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Loại thuốc lá:</Typography>
              <Typography variant="h6" color="primary">{userData.smokingStatus.cigaretteType || 'Chưa cập nhật'}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Tần suất hút thuốc:</Typography>
              <Typography variant="h6" color="primary">{userData.smokingStatus.smokingFrequency || 'Chưa cập nhật'}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Tình trạng sức khỏe:</Typography>
              <Typography variant="h6" color="primary">{userData.smokingStatus.healthStatus || 'Chưa cập nhật'}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Nhật ký hôm nay:</Typography>
              <Typography variant="body1" color="primary">
                {userData.smokingStatus.dailyLog.cigarettes} điếu - {userData.smokingStatus.dailyLog.feeling || 'Chưa có cảm nhận'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        {/* Thống kê chi phí */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>💰 Thống kê chi phí</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2">Chi phí/ngày:</Typography>
              <Typography variant="h6" color="error">
                {((userData.smokingStatus.cigarettesPerDay / 20) * userData.smokingStatus.costPerPack).toLocaleString()} VNĐ
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2">Chi phí/tháng:</Typography>
              <Typography variant="h6" color="error">
                {(((userData.smokingStatus.cigarettesPerDay / 20) * userData.smokingStatus.costPerPack) * 30).toLocaleString()} VNĐ
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2">Chi phí/năm:</Typography>
              <Typography variant="h6" color="error">
                {(((userData.smokingStatus.cigarettesPerDay / 20) * userData.smokingStatus.costPerPack) * 365).toLocaleString()} VNĐ
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2">Tổng điếu/tháng:</Typography>
              <Typography variant="h6" color="warning.dark">
                {userData.smokingStatus.cigarettesPerDay * 30} điếu
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Form chỉnh sửa tình trạng hút thuốc */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          ✏️ Cập nhật tình trạng hút thuốc
          <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
            (Dữ liệu được lưu tự động khi bạn nhập)
          </Typography>
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Số điếu thuốc/ngày"
              value={userData.smokingStatus.cigarettesPerDay}
              onChange={(e) => setUserDataWithAutoSave({
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
              onChange={(e) => setUserDataWithAutoSave({
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
              onChange={(e) => setUserDataWithAutoSave({
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
              onChange={(e) => setUserDataWithAutoSave({
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
              onChange={(e) => setUserDataWithAutoSave({
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
              onChange={(e) => setUserDataWithAutoSave({
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
                onChange={(e) => setUserDataWithAutoSave({
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
                onChange={(e) => setUserDataWithAutoSave({
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
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveProgress}
            sx={{ mt: 2 }}
            disabled={loading}
          >
            Lưu nhật ký tiến độ
          </Button>
        </Box>
      
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
            <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
              (Tự động lưu khi nhập)
            </Typography>
          </Typography>
          <TextField
            fullWidth
            label="Ngày bắt đầu"
            type="date"
            value={userData.quitPlan?.startDate || ''}
            onChange={e =>
              setUserDataWithAutoSave(prev => ({
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
              setUserDataWithAutoSave(prev => ({
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
              setUserDataWithAutoSave(prev => ({
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
              setUserDataWithAutoSave(prev => ({
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
              setUserDataWithAutoSave(prev => ({
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
              setUserDataWithAutoSave(prev => ({
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