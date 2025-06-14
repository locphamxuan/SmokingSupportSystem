// Trang đăng ký gói nâng cấp

import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  styled,
  Alert,
  Snackbar,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { useNavigate } from 'react-router-dom';
import Payment from '../components/Payment'; // Component xử lý thanh toán
import axios from 'axios';

// Styled components cho các thành phần UI
const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isPremium'
})(({ theme, isPremium }) => ({
  height: '100%',
  borderRadius: 15,
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.3s ease',
  background: isPremium ? 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)' : 'white',
  color: isPremium ? 'white' : 'inherit',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
}));

const FeatureList = styled(List)({
  padding: 0,
  margin: 0,
  textAlign: 'left',
});

const FeatureItem = styled(ListItem)({
  padding: '10px 0',
  display: 'flex',
  alignItems: 'center',
  fontSize: '1rem',
});

const UpgradeButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#28a745',
  color: 'white',
  padding: '12px 30px',
  fontWeight: 'bold',
  marginTop: theme.spacing(4),
  '&:hover': {
    backgroundColor: '#218838',
    transform: 'scale(1.05)',
  },
}));

const PremiumStatusCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)',
  borderRadius: 15,
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
  marginBottom: theme.spacing(4),
}));

const SubscriptionPlans = () => {
  const navigate = useNavigate();
  // State để lưu trữ thông báo lỗi
  const [error, setError] = useState('');
  // State để lưu trữ thông báo thành công
  const [success, setSuccess] = useState('');
  // State để quản lý việc mở/đóng dialog thanh toán
  const [paymentOpen, setPaymentOpen] = useState(false);
  // State để lưu trữ thông tin người dùng hiện tại
  const [user, setUser] = useState(null);

  // Định nghĩa các tính năng cho gói miễn phí và Premium
  const features = {
    free: [
      'Theo dõi thời gian cai thuốc',
      'Nhật ký cai thuốc cơ bản',
      'Thống kê đơn giản',
      'Cộng đồng hỗ trợ'
    ],
    premium: [
      'Tất cả tính năng của gói Miễn phí',
      'Nhật ký chi tiết với hình ảnh',
      'Thống kê nâng cao',
      'Tư vấn chuyên gia',
      'Kế hoạch cai thuốc cá nhân hóa',
      'Ứng dụng không quảng cáo'
    ]
  };

  // Xử lý khi nhấn nút nâng cấp
  const handleUpgrade = () => {
    setPaymentOpen(true); // Mở dialog thanh toán
  };

  // Xử lý đóng Snackbar thông báo
  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  // Xử lý khi thanh toán thành công
  const handlePaymentSuccess = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login'); // Điều hướng nếu không có token
        return;
      }

      // Gửi yêu cầu API để nâng cấp tài khoản thành viên
      const response = await axios.put('http://localhost:5000/api/auth/upgrade-member', {}, {
        headers: { Authorization: `Bearer ${token}` } // Gửi token xác thực
      });
      
      if (response.data && response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user)); // Cập nhật thông tin người dùng trong localStorage
        setUser(response.data.user);
        setSuccess('Nâng cấp tài khoản thành công!'); // Thông báo thành công
        setTimeout(() => {
          navigate('/profile'); // Điều hướng về trang profile sau 2 giây
        }, 2000);
      }
    } catch (error) {
      console.error('Lỗi khi nâng cấp tài khoản:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token'); // Xóa token và user nếu phiên hết hạn
        localStorage.removeItem('user');
        navigate('/login');
      } else if (error.response?.status === 400) {
        setError(error.response.data.message || 'Không thể nâng cấp tài khoản. Vui lòng thử lại sau.');
      } else {
        setError('Không thể nâng cấp tài khoản. Vui lòng thử lại sau.');
      }
    }
  };

  // useEffect để tải thông tin người dùng khi component được mount
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    let currentUser = null;
    try {
      if (userStr && userStr !== 'undefined') {
        currentUser = JSON.parse(userStr);
      }
    } catch (e) {
      currentUser = null;
    }

    if (!currentUser) {
      navigate('/login'); // Điều hướng nếu không có người dùng
      return;
    }

    // Nếu là admin, điều hướng về trang admin
    if (currentUser.role === "admin") {
      navigate("/admin/users");
      return;
    }

    setUser(currentUser); // Cập nhật state user
  }, [navigate]);

  // Kiểm tra xem người dùng đã là thành viên Premium hay chưa
  const isPremiumMember = user && (user.role === 'member' || user.isMember);

  // Hiển thị trạng thái tải nếu chưa có thông tin người dùng
  if (!user) {
    return null; // Có thể thay bằng CircularProgress hoặc Skeleton
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      py: 5
    }}>
      <Container>
        {/* Hiển thị giao diện cho thành viên Premium hoặc Guest */}
        {isPremiumMember ? (
          // Giao diện cho user đã là Premium member
          <>
            <PremiumStatusCard>
              <WorkspacePremiumIcon sx={{ fontSize: 80, color: '#ff6b35', mb: 2 }} />
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                🎉 Bạn đã đăng ký gói Premium!
              </Typography>
              <Typography variant="h6" color="text.secondary" paragraph>
                Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ Premium của chúng tôi.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/profile')}
                sx={{
                  backgroundColor: '#ff6b35',
                  '&:hover': { backgroundColor: '#e55a2b' },
                  mt: 2
                }}
              >
                Quay về trang cá nhân
              </Button>
            </PremiumStatusCard>

            {/* Hiển thị các tính năng Premium đang sử dụng */}
            <Typography variant="h5" align="center" gutterBottom sx={{ mb: 4 }}>
              Các tính năng Premium bạn đang sử dụng
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              <Grid item xs={12} md={8}>
                <StyledCard isPremium>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
                      Gói Premium - Đang hoạt động
                    </Typography>
                    <FeatureList>
                      {features.premium.map((feature, index) => (
                        <FeatureItem key={index}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <CheckCircleIcon sx={{ color: 'white' }} />
                          </ListItemIcon>
                          <ListItemText primary={feature} />
                        </FeatureItem>
                      ))}
                    </FeatureList>
                  </CardContent>
                </StyledCard>
              </Grid>
            </Grid>
          </>
        ) : (
          // Giao diện cho Guest user (chưa phải Premium)
          <>
            <Typography variant="h4" align="center" gutterBottom sx={{ mb: 5 }}>
              Chọn gói phù hợp với bạn
            </Typography>
            <Typography variant="h6" align="center" color="text.secondary" paragraph>
              Nâng cấp lên Premium để trải nghiệm đầy đủ tính năng.
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {/* Gói Miễn phí */}
              <Grid item xs={12} md={6} lg={5}>
                <StyledCard>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
                      Gói Miễn phí
                    </Typography>
                    <Typography variant="h3" color="primary" gutterBottom>
                      Miễn phí
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Trải nghiệm cơ bản</Typography>
                    <Divider sx={{ my: 3 }} />
                    <FeatureList>
                      {features.free.map((feature, index) => (
                        <FeatureItem key={index}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <CheckCircleIcon color="success" />
                          </ListItemIcon>
                          <ListItemText primary={feature} />
                        </FeatureItem>
                      ))}
                    </FeatureList>
                    <Button 
                      variant="outlined" 
                      disabled 
                      size="large" 
                      sx={{ mt: 4 }}
                    >
                      Đang sử dụng
                    </Button>
                  </CardContent>
                </StyledCard>
              </Grid>
              {/* Gói Premium */}
              <Grid item xs={12} md={6} lg={5}>
                <StyledCard isPremium>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
                      Gói Premium
                    </Typography>
                    <Typography variant="h3" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
                      199.000 VNĐ <br/>
                      <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.7)' }}>/tháng</Typography>
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Nâng cao trải nghiệm</Typography>
                    <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.3)' }} />
                    <FeatureList>
                      {features.premium.map((feature, index) => (
                        <FeatureItem key={index}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <CheckCircleIcon sx={{ color: 'white' }} />
                          </ListItemIcon>
                          <ListItemText primary={feature} sx={{ color: 'white' }} />
                        </FeatureItem>
                      ))}
                    </FeatureList>
                    <UpgradeButton 
                      onClick={handleUpgrade}
                    >
                      Nâng cấp ngay
                    </UpgradeButton>
                  </CardContent>
                </StyledCard>
              </Grid>
            </Grid>
          </>
        )}

        {/* Dialog thanh toán */}
        <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#1976d2', color: 'white' }}>Thanh toán Gói Premium</DialogTitle>
          <DialogContent>
            <Payment onPaymentSuccess={handlePaymentSuccess} onPaymentError={(msg) => setError(msg)} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentOpen(false)}>Đóng</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar thông báo chung */}
        <Snackbar open={!!error || !!success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={error ? "error" : "success"} sx={{ width: '100%' }}>
            {error || success}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default SubscriptionPlans; 
