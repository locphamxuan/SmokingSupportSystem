import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, LinearProgress, Grid, CircularProgress, Alert, Snackbar,
  List, ListItem, ListItemText
} from '@mui/material';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const CoachMemberProgressPage = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMemberProgress = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await axios.get(`http://localhost:5000/api/hlv/member/${memberId}/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMemberData(response.data);
      } catch (err) {
        console.error('Lỗi khi tải tiến trình của thành viên:', err);
        setError(err.response?.data?.message || 'Không thể tải tiến trình của thành viên.');
      } finally {
        setLoading(false);
      }
    };

    fetchMemberProgress();
  }, [memberId, navigate]);

  const handleCloseSnackbar = () => {
    setError('');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !memberData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || 'Không tìm thấy dữ liệu tiến trình cho thành viên này.'}</Alert>
        <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Container>
    );
  }

  const { smokingProfile, latestProgress, quitPlan } = memberData;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
          Tiến trình của thành viên: {memberData.username || memberId}
        </Typography>

        {/* Thông tin tình trạng hút thuốc */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#3f51b5' }}>
            📊 Thông tin tình trạng hút thuốc
          </Typography>
          {smokingProfile ? (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Typography><b>Số điếu thuốc/ngày:</b> {smokingProfile.cigarettesPerDay || 0}</Typography>
                <Typography><b>Chi phí/gói:</b> {smokingProfile.costPerPack || 0} VNĐ</Typography>
                <Typography><b>Loại thuốc lá:</b> {smokingProfile.cigaretteType || 'Chưa cập nhật'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><b>Tần suất hút thuốc:</b> {smokingProfile.smokingFrequency || 'Chưa cập nhật'}</Typography>
                <Typography><b>Tình trạng sức khỏe:</b> {smokingProfile.healthStatus || 'Chưa cập nhật'}</Typography>
                <Typography><b>Lý do cai thuốc:</b> {smokingProfile.QuitReason || 'Chưa cập nhật'}</Typography>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary">Chưa có thông tin tình trạng hút thuốc.</Typography>
          )}
        </Box>

        {/* Nhật ký tiến trình mới nhất */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#3f51b5' }}>
            📈 Nhật ký tiến trình mới nhất
          </Typography>
          {latestProgress ? (
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} md={6}>
                <Typography><b>Ngày:</b> {new Date(latestProgress.Date).toLocaleDateString()}</Typography>
                <Typography><b>Số điếu hút:</b> {latestProgress.Cigarettes || 0}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><b>Số tiền chi tiêu:</b> {latestProgress.MoneySpent || 0} VNĐ</Typography>
                <Typography><b>Ghi chú:</b> {latestProgress.Note || 'Không có'}</Typography>
                <Typography><b>Ghi chú của Huấn luyện viên:</b> {latestProgress.CoachNote || 'Không có'}</Typography>
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary">Chưa có nhật ký tiến trình nào.</Typography>
          )}
        </Box>

        {/* Kế hoạch cai thuốc */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#3f51b5' }}>
            🎯 Kế hoạch cai thuốc
          </Typography>
          {quitPlan ? (
            <> 
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Typography><b>Ngày bắt đầu:</b> {quitPlan.startDate}</Typography>
                  <Typography><b>Ngày mục tiêu:</b> {quitPlan.targetDate}</Typography>
                  <Typography><b>Loại kế hoạch:</b> {quitPlan.planType}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography><b>Số điếu ban đầu:</b> {quitPlan.initialCigarettes}</Typography>
                  <Typography><b>Giảm mỗi ngày:</b> {quitPlan.dailyReduction}</Typography>
                </Grid>
              </Grid>
              <Typography sx={{ mt: 2 }}><b>Chi tiết kế hoạch:</b> {quitPlan.planDetail || 'Không có'}</Typography>
              <Typography sx={{ mt: 2, fontWeight: 600 }}>Các mốc kế hoạch:</Typography>
              {Array.isArray(quitPlan.milestones) && quitPlan.milestones.length > 0 ? (
                <List>
                  {quitPlan.milestones.map((milestone, index) => (
                    typeof milestone === 'string' ? (
                      <ListItem key={index}><ListItemText primary={milestone} /></ListItem>
                    ) : (
                      <ListItem key={index}>
                        <ListItemText primary={milestone.title} secondary={milestone.date} />
                      </ListItem>
                    )
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ ml: 2 }}>Chưa có mốc nào.</Typography>
              )}
            </>
          ) : (
            <Typography color="text.secondary">Chưa có kế hoạch cai thuốc nào.</Typography>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default CoachMemberProgressPage; 