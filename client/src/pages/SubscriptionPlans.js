//trang đăng ký gói nâng cấp

import React, { useState } from 'react';
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
  Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import Payment from '../components/Payment';

// Styled components
const StyledCard = styled(Card)(({ theme, isPremium }) => ({
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

const SubscriptionPlans = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);

  const features = {
    free: [
      'Track quit smoking time',
      'Basic quit smoking journal',
      'Simple statistics',
      'Support community'
    ],
    premium: [
      'All Free features',
      'Detailed journal with images',
      'Advanced statistics',
      'Expert consultation',
      'Personalized quit plan',
      'Ad-free experience'
    ]
  };

  const handleUpgrade = () => {
    setPaymentOpen(true);
  };

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  const handlePaymentSuccess = () => {
    setSuccess('Account upgrade successful!');
    setTimeout(() => {
      navigate('/profile');
    }, 2000);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      py: 5
    }}>
      <Container>
        <Typography variant="h4" align="center" gutterBottom sx={{ mb: 5 }}>
          Choose Your Plan
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" paragraph>
          Select the plan that best fits your needs
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={6} lg={5}>
            <StyledCard>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
                  Basic Plan
                </Typography>
                <Typography variant="h3" color="primary" gutterBottom>
                  $0
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
                  Premium Plan
                </Typography>
                <Typography variant="h3" color="primary" gutterBottom>
                  $199/month
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
                  Upgrade Now
                </UpgradeButton>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
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