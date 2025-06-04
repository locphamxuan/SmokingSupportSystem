//trang đăng ký gói nâng cấp

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
  Paper
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { useNavigate } from 'react-router-dom';
import Payment from '../components/Payment';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Styled components
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [user, setUser] = useState(null);

  const features = {
    free: [
      'Theo dõi thời gian cai thuốc',
      'Nhật ký cai thuốc cơ bản',
      'Thống kê đơn giản',
      'Cộng đồng hỗ trợ'
    ],
    premium: [
      'Tất cả tính năng Free',
      'Nhật ký chi tiết với hình ảnh',
      'Thống kê nâng cao',
      'Tư vấn chuyên gia',
      'Kế hoạch cai thuốc cá nhân hóa',
      'Ứng dụng không quảng cáo'
    ]
  };

  const handleUpgrade = () => {
    setPaymentOpen(true);
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  const handlePaymentSuccess = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.put(`${API_BASE_URL}/auth/upgrade-member`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        setSuccess('Nâng cấp tài khoản thành công!');
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      }
    } catch (error) {
      console.error('Error upgrading account:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else if (error.response?.status === 400) {
        setError(error.response.data.message || 'Không thể nâng cấp tài khoản. Vui lòng thử lại sau.');
      } else {
        setError('Không thể nâng cấp tài khoản. Vui lòng thử lại sau.');
      }
    }
  };

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
      navigate('/login');
      return;
    }

    if (currentUser.role === "admin") {
      navigate("/admin/users");
      return;
    }

    setUser(currentUser);
  }, [navigate]);

  // Kiểm tra user đã là premium member chưa
  const isPremiumMember = user && (user.role === 'member' || user.isMember);

  if (!user) {
    return null; // Loading state
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      py: 5
    }}>
      <Container>
        {isPremiumMember ? (
          // Hiển thị cho user đã là premium member
          <>
            <PremiumStatusCard>
              <WorkspacePremiumIcon sx={{ fontSize: 80, color: '#ff6b35', mb: 2 }} />
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
                🎉 Bạn đã đăng ký gói Premium!
              </Typography>
              <Typography variant="h6" color="text.secondary" paragraph>
                Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ Premium của chúng tôi
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
          // Hiển thị cho guest user
          <>
            <Typography variant="h4" align="center" gutterBottom sx={{ mb: 5 }}>
              Chọn gói phù hợp với bạn
            </Typography>
            <Typography variant="h6" align="center" color="text.secondary" paragraph>
              Nâng cấp lên Premium để trải nghiệm đầy đủ tính năng
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              <Grid item xs={12} md={6} lg={5}>
                <StyledCard>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
                      Gói Miễn phí
                    </Typography>
                    <Typography variant="h3" color="primary" gutterBottom>
                      Miễn phí
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Gói hiện tại của bạn
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    <FeatureList>
                      {features.free.map((feature, index) => (
                        <FeatureItem key={index}>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <CheckCircleIcon sx={{ color: '#28a745' }} />
                          </ListItemIcon>
                          <ListItemText primary={feature} />
                        </FeatureItem>
                      ))}
                    </FeatureList>
                  </CardContent>
                </StyledCard>
              </Grid>
              <Grid item xs={12} md={6} lg={5}>
                <StyledCard isPremium>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
                      Gói Premium
                    </Typography>
                    <Typography variant="h3" gutterBottom>
                      199.000đ/tháng
                    </Typography>
                    <Typography variant="body2" gutterBottom sx={{ opacity: 0.9 }}>
                      Trải nghiệm đầy đủ tính năng
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
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
                    <UpgradeButton
                      variant="contained"
                      size="large"
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
      </Container>

      <Payment
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Success/Error Messages */}
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
    </Box>
  );
};

export default SubscriptionPlans; 