import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container, Paper, Typography, Grid, TextField, Button, Box, LinearProgress, List, ListItem, ListItemText, Snackbar, Alert, Dialog, Chip, Card, CardContent, MenuItem, DialogTitle, DialogContent, DialogActions, CircularProgress
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
    role: 'guest',
    coachId: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [openBookCoachDialog, setOpenBookCoachDialog] = useState(false);
  const [coaches, setCoaches] = useState([]);
  const [bookingCoach, setBookingCoach] = useState(false);
  const [openBookAppointmentDialog, setOpenBookAppointmentDialog] = useState(false);
  const [openCoachSelectionForAppointmentDialog, setOpenCoachSelectionForAppointmentDialog] = useState(false);
  const [selectedCoachForAppointment, setSelectedCoachForAppointment] = useState(null);
  const [appointmentDetails, setAppointmentDetails] = useState({
    scheduledTime: null,
    status: 'đang chờ xác nhận',
    note: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const navigate = useNavigate();
  
  const debounceTimeoutRef = useRef(null);
  const lastSavedDataRef = useRef(null);

  const fetchCoaches = useCallback(async () => {
    console.log('Bắt đầu tải danh sách huấn luyện viên...');
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('Không tìm thấy token, điều hướng đến trang đăng nhập.');
        navigate('/login');
        return;
      }
      console.log('Đang gọi API /api/hlv...');
      const response = await axios.get('http://localhost:5000/api/hlv', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Phản hồi API cho huấn luyện viên:', response.data);
      setCoaches(response.data.coaches);
      console.log('Đã tải danh sách huấn luyện viên để lựa chọn:', response.data.coaches);
    } catch (error) {
      console.error('❌ Lỗi khi tải danh sách huấn luyện viên:', error);
      setError('Không thể tải danh sách huấn luyện viên.');
    } finally {
      setLoading(false);
      console.log('Kết thúc tải danh sách huấn luyện viên.');
    }
  }, [navigate]);

  const setUserDataWithAutoSave = useCallback((newData) => {
    setUserData(prevUserData => {
      const updatedData = typeof newData === 'function' ? newData(prevUserData) : newData;
      
      try {
        localStorage.setItem('myProgressData', JSON.stringify(updatedData));
        console.log('✅ Dữ liệu đã được lưu vào localStorage');
      } catch (error) {
        console.error('❌ Lỗi khi lưu vào localStorage:', error);
      }
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          if (JSON.stringify(updatedData) === JSON.stringify(lastSavedDataRef.current)) {
            return;
          }

          setAutoSaveStatus('saving');
          const token = localStorage.getItem('token');
          if (!token) return;

          await axios.put('http://localhost:5000/api/auth/smoking-status', {
            cigarettesPerDay: Number(updatedData.smokingStatus.cigarettesPerDay),
            costPerPack: Number(updatedData.smokingStatus.costPerPack),
            smokingFrequency: String(updatedData.smokingStatus.smokingFrequency),
            healthStatus: String(updatedData.smokingStatus.healthStatus),
            cigaretteType: String(updatedData.smokingStatus.cigaretteType || ''),
            quitReason: String(updatedData.smokingStatus.quitReason || ''),
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
      
      let dailyLog = {
        cigarettes: profileRes.data.smokingStatus?.dailyLog?.cigarettes || 0,
        feeling: profileRes.data.smokingStatus?.dailyLog?.feeling || ''
      };

      // Lấy nhật ký hôm nay từ Progress (nếu có)
      const today = new Date().toISOString().slice(0, 10);
      const progressRes = await axios.get('http://localhost:5000/api/auth/progress/latest', {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: { progress: null } })); // Handle progress not found
      if (progressRes.data.progress && progressRes.data.progress.Date?.slice(0, 10) === today) {
        dailyLog = {
          cigarettes: progressRes.data.progress.Cigarettes,
          feeling: progressRes.data.progress.Note
        };
      }

      const serverData = {
        id: profileRes.data.id,
        username: profileRes.data.username,
        email: profileRes.data.email,
        phoneNumber: profileRes.data.phoneNumber,
        address: profileRes.data.address,
        role: profileRes.data.role,
        isMember: profileRes.data.isMember,
        coachId: profileRes.data.coachId,
        smokingStatus: {
          ...profileRes.data.smokingStatus,
          dailyLog
        },
        quitPlan: quitPlanRes.data.quitPlan || null
      };

      console.log('📊 Processed server data:', serverData);
      console.log('🚭 Smoking status:', serverData.smokingStatus);
      console.log('🚦 Quit plan (processed):', serverData.quitPlan);

      setUserData(serverData);
      lastSavedDataRef.current = JSON.parse(JSON.stringify(serverData));
      
      // Save to localStorage
      try {
        localStorage.setItem('myProgressData', JSON.stringify(serverData));
        console.log('✅ Data saved to localStorage');
      } catch (error) {
        console.error('❌ Failed to save to localStorage:', error);
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
        planDetail: userData.quitPlan.planDetail || '',
      
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

      console.log('Attempting to save progress with data:', { planId, date, cigarettes, moneySpent, note });

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
      await fetchAllUserData();
    } catch (error) {
      console.error('❌ Error saving progress:', error);
      setError(error.response?.data?.message || 'Lỗi khi lưu nhật ký tiến độ!');
    } finally {
      setLoading(false);
    }
  };

  const handleBookCoach = async (coachId) => {
    console.log('Attempting to book coach with ID:', coachId);
    try {
      setBookingCoach(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      await axios.post(
        'http://localhost:5000/api/bookings/book-coach',
        { coachId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Gán huấn luyện viên thành công!');
      setError('');
      setOpenBookCoachDialog(false);
      await fetchAllUserData();
    } catch (error) {
      setError(error.response?.data?.message || 'Lỗi khi đặt lịch với Coach.');
    } finally {
      setBookingCoach(false);
    }
  };

  // Xử lý mở dialog đặt lịch
  const handleOpenBookAppointmentDialog = () => {
    // Luôn mở dialog chọn coach trước
    setOpenCoachSelectionForAppointmentDialog(true);
    fetchCoaches(); // Fetch coaches when dialog opens
    setBookingError(null); // Clear previous errors
    setBookingSuccess(false); // Clear previous success
  };

  // Xử lý đóng dialog chọn huấn luyện viên để đặt lịch
  const handleCloseCoachSelectionForAppointmentDialog = () => {
    setOpenCoachSelectionForAppointmentDialog(false);
    setSelectedCoachForAppointment(null);
  };

  // Xử lý chọn huấn luyện viên từ danh sách để đặt lịch
  const handleSelectCoachForAppointment = async (coach) => {
    setBookingError(null); // Clear previous errors
    setBookingSuccess(false); // Clear previous success

    if (!userData.coachId) { // User has no assigned coach yet
      setBookingLoading(true); // Indicate booking in progress
      try {
        await handleBookCoach(coach.Id); // Assign the coach
        // After successfully assigning coach, userData.coachId should be updated by fetchAllUserData in handleBookCoach
        // Need to re-fetch user data to ensure userData.coachId is updated for the next check
        await fetchAllUserData(); // Re-fetch all user data to ensure coachId is updated
        
        // Now, proceed to book appointment with the newly assigned coach (which is now userData.coachId)
        setSelectedCoachForAppointment(coach);
        setOpenCoachSelectionForAppointmentDialog(false);
        setOpenBookAppointmentDialog(true);
      } catch (error) {
        setBookingError(error.response?.data?.message || 'Không thể gán huấn luyện viên.');
      } finally {
        setBookingLoading(false);
      }
    } else if (userData.coachId !== coach.Id) { // User has a coach, but selected a different one
      setBookingError('Bạn chỉ có thể đặt lịch với huấn luyện viên đã được gán cho mình.');
      // Keep the coach selection dialog open to allow user to choose their assigned coach
    } else { // User has a coach, and selected their assigned coach
      setSelectedCoachForAppointment(coach);
      setOpenCoachSelectionForAppointmentDialog(false);
      setOpenBookAppointmentDialog(true);
    }
  };

  // Xử lý đóng dialog đặt lịch
  const handleCloseBookAppointmentDialog = () => {
    setOpenBookAppointmentDialog(false);
    // Reset form khi đóng
    setAppointmentDetails({
      scheduledTime: null,
      status: 'đang chờ xác nhận',
      note: '',
    });
  };

  // Xử lý đặt lịch hẹn
  const handleBookAppointment = async () => {
    if (!appointmentDetails.scheduledTime) {
      setBookingError('Vui lòng chọn thời gian hẹn.');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);
    setBookingSuccess(false);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/bookings/book-appointment',
        {
          coachId: selectedCoachForAppointment.Id,
          scheduledTime: appointmentDetails.scheduledTime,
          status: 'đang chờ xác nhận',
          note: appointmentDetails.note,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setBookingSuccess(true);
      // Optional: Refresh user data or show a success message then close
      setTimeout(() => {
        handleCloseBookAppointmentDialog();
        // You might want to re-fetch user data or bookings here if they are displayed on the page
      }, 2000);
    } catch (error) {
      console.error('Error booking appointment:', error);
      setBookingError(error.response?.data?.message || 'Không thể đặt lịch hẹn. Vui lòng thử lại.');
    } finally {
      setBookingLoading(false);
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
            {userData.isMember && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Huấn luyện viên của bạn:</Typography>
                {userData.coachId ? (
                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => navigate(`/chat-coach/${userData.coachId}`)}
                    >
                      Chat với Huấn luyện viên
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleOpenBookAppointmentDialog}
                    >
                      Đặt lịch hẹn
                    </Button>
                  </Box>
                ) : (
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    size="small" 
                    onClick={handleOpenBookAppointmentDialog}
                  >
                    Đặt lịch với Coach
                  </Button>
                )}
              </Box>
            )}
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
        {console.log('🟢 Render quitPlan:', userData.quitPlan)}
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
            <Typography sx={{ mt: 2 }}>
              <b>Chi tiết kế hoạch:</b> {userData.quitPlan.planDetail || 'Không có'}
            </Typography>
            <Typography>
              <b>Loại kế hoạch:</b> {userData.quitPlan.planType || 'Không có'}
            </Typography>
            <Typography>
              <b>Số điếu ban đầu:</b> {userData.quitPlan.initialCigarettes}
            </Typography>
            <Typography>
              <b>Giảm mỗi ngày:</b> {userData.quitPlan.dailyReduction}
            </Typography>
            <Typography sx={{ mt: 2, fontWeight: 600 }}>Các mốc kế hoạch:</Typography>
            {Array.isArray(userData.quitPlan.milestones) && userData.quitPlan.milestones.length > 0 ? (
              <List>
                {userData.quitPlan.milestones.map((milestone, index) => (
                  typeof milestone === 'string' ? (
                    <ListItem key={index}>
                      <ListItemText primary={milestone} />
                    </ListItem>
                  ) : (
                    <ListItem key={index}>
                      <ListItemText
                        primary={milestone.title || 'Mốc'}
                        secondary={milestone.date || ''}
                      />
                    </ListItem>
                  )
                ))}
              </List>
            ) : (
              <Typography color="text.secondary" sx={{ ml: 2 }}>
                Chưa có mốc nào trong kế hoạch.
              </Typography>
            )}
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

      {/* Book Coach Dialog */}
      <Dialog open={openBookCoachDialog} onClose={() => setOpenBookCoachDialog(false)}>
        <Box sx={{ p: 3, minWidth: 350 }}>
          <Typography variant="h6" gutterBottom>Chọn huấn luyện viên</Typography>
          {coaches.length === 0 ? (
            <Typography>Không có huấn luyện viên nào khả dụng.</Typography>
          ) : (
            <List>
              {coaches.map(coach => (
                <ListItem 
                  key={coach.Id}
                  secondaryAction={
                    <Button 
                      variant="outlined" 
                      onClick={() => handleBookCoach(coach.Id)}
                      disabled={bookingCoach}
                    >
                      {bookingCoach ? 'Đang chọn...' : 'Chọn Coach'}
                    </Button>
                  }
                >
                  <ListItemText primary={coach.Username} secondary={coach.Email} />
                </ListItem>
              ))}
            </List>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={() => setOpenBookCoachDialog(false)}>Đóng</Button>
          </Box>
        </Box>
      </Dialog>

      {/* Dialog chọn huấn luyện viên để đặt lịch */}
      <Dialog open={openCoachSelectionForAppointmentDialog} onClose={handleCloseCoachSelectionForAppointmentDialog}>
        <DialogTitle>Chọn huấn luyện viên để đặt lịch hẹn</DialogTitle>
        <DialogContent>
          {loading && <CircularProgress />}
          {error && <Alert severity="error">{error}</Alert>}
          <List>
            {coaches.length > 0 ? (
              coaches.map((coach) => (
                <ListItem key={coach.Id} divider>
                  <ListItemText
                    primary={coach.Username}
                    secondary={
                      <>
                        <Typography variant="body2">Email: {coach.Email}</Typography>
                        <Typography variant="body2">Số điện thoại: {coach.PhoneNumber}</Typography>
                      </>
                    }
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleSelectCoachForAppointment(coach)}
                    disabled={coach.Id === userData.coachId}
                  >
                    {coach.Id === userData.coachId ? 'Đã gán' : 'Chọn'}
                  </Button>
                </ListItem>
              ))
            ) : (
              !loading && !error && <Typography>Không có huấn luyện viên nào.</Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCoachSelectionForAppointmentDialog} color="primary">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog đặt lịch hẹn */}
      <Dialog open={openBookAppointmentDialog} onClose={handleCloseBookAppointmentDialog}>
        <DialogTitle>Đặt lịch hẹn với Huấn luyện viên</DialogTitle>
        <DialogContent>
          {bookingError && <Alert severity="error" sx={{ mb: 2 }}>{bookingError}</Alert>}
          {bookingSuccess && <Alert severity="success" sx={{ mb: 2 }}>Đặt lịch hẹn thành công!</Alert>}
          {selectedCoachForAppointment && (
            <TextField
              label="Huấn luyện viên"
              fullWidth
              value={selectedCoachForAppointment.Username}
              InputProps={{ readOnly: true }}
              sx={{ mb: 2 }}
            />
          )}
          <TextField
            label="Thời gian hẹn"
            type="datetime-local"
            fullWidth
            required
            value={appointmentDetails.scheduledTime ? new Date(appointmentDetails.scheduledTime).toISOString().slice(0, 16) : ''}
            onChange={(e) => setAppointmentDetails({ ...appointmentDetails, scheduledTime: e.target.value })}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ mb: 2 }}
          />
          {/* <TextField
            select
            label="Trạng thái"
            fullWidth
            value={appointmentDetails.status}
            onChange={(e) => setAppointmentDetails({ ...appointmentDetails, status: e.target.value })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="Pending">Chờ xác nhận</MenuItem>
            <MenuItem value="Confirmed">Đã xác nhận</MenuItem>
            <MenuItem value="Cancelled">Đã hủy</MenuItem>
            <MenuItem value="Completed">Hoàn thành</MenuItem>
          </TextField> */}
          <TextField
            label="Ghi chú"
            multiline
            rows={4}
            fullWidth
            value={appointmentDetails.note}
            onChange={(e) => setAppointmentDetails({ ...appointmentDetails, note: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBookAppointmentDialog} color="primary">
            Hủy
          </Button>
          <Button onClick={handleBookAppointment} color="primary" variant="contained" disabled={bookingLoading}>
            {bookingLoading ? <CircularProgress size={24} /> : 'Đặt lịch'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyProgressPage;