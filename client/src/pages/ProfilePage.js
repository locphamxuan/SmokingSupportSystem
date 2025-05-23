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
      await axios.put('/api/auth/smoking-status', userData.smokingStatus, {
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
              Personal Profile
            </Typography>

            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
              <Tab label="Personal Information" />
              <Tab label="Smoking Status" />
              <Tab 
                label="Quit Plan" 
                disabled={!userData.isPremium}
                sx={{ 
                  opacity: userData.isPremium ? 1 : 0.5,
                  '&.Mui-disabled': {
                    color: 'text.secondary'
                  }
                }}
              />
              <Tab 
                label="Achievements" 
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
                      label="Username"
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
                      label="Phone Number"
                      value={userData.phoneNumber}
                      onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                      margin="normal"
                      disabled={loading}
                    />
                    <TextField
                      fullWidth
                      label="Address"
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
                  {loading ? 'Updating...' : 'Update Profile'}
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
                      label="Cigarettes per day"
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
                      label="Cost per pack ($)"
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
                      label="Smoking frequency"
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
                      label="Health status"
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
                  {loading ? 'Updating...' : 'Update Status'}
                </Button>
              </Paper>
            )}

            {activeTab === 2 && userData.isPremium && (
              <Paper sx={{ p: 3 }}>
                {userData.quitPlan.startDate ? (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Current Quit Plan
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography>
                          Start Date: {new Date(userData.quitPlan.startDate).toLocaleDateString()}
                        </Typography>
                        <Typography>
                          Target Date: {new Date(userData.quitPlan.targetDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1">Progress</Typography>
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
                    Create New Quit Plan
                  </Button>
                )}
              </Paper>
            )}

            {activeTab === 3 && userData.isPremium && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Badges and Achievements
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
                            Achieved: {new Date(achievement.date).toLocaleDateString()}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button size="small">Share</Button>
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
                  Upgrade to Premium
                </Typography>
                <Typography variant="body1" paragraph>
                  Upgrade to Premium account to:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Create Quit Plan"
                      secondary="Create and track your personal quit smoking plan"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="View Achievements"
                      secondary="Track progress and earn badges"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Coach Consultation"
                      secondary="Ask questions and get online advice"
                    />
                  </ListItem>
                </List>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/subscription')}
                  sx={{ mt: 2 }}
                >
                  Upgrade Now
                </Button>
              </Paper>
            )}

            {userData.isPremium && (
              <Paper sx={{ p: 3, mt: 3, bgcolor: 'primary.light' }}>
                <Typography variant="h6" gutterBottom>
                  Premium Features
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Coach Consultation"
                      secondary="Ask questions and get online advice"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Detailed Reports"
                      secondary="View advanced reports about your quit journey"
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Quit Plan</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="date"
            label="Start Date"
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
            label="Target Date"
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
            Cancel
          </Button>
          <Button onClick={handleSaveQuitPlan} variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create Plan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePage; 