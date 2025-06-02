//trang hiện thị trò chuyện và đặt lịch tư vấn

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Typography, Button, Box, Grid, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ConsultCoachPage = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get('http://localhost:5000/api/coaches', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setCoaches(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  if (loading) return <div>Đang tải danh sách coach...</div>;

  return (
    <Box display="flex" flexDirection="column" alignItems="center" minHeight="80vh" mt={4}>
      <Box display="flex" alignItems="center" mb={3} width="100%" maxWidth={600}>
        <IconButton onClick={() => navigate(-1)} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ ml: 1, fontWeight: 600 }}>
          Danh sách Coach
        </Typography>
      </Box>
      <Grid container spacing={2} maxWidth={600}>
        {coaches.map(coach => (
          <Grid item xs={12} key={coach.Id}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700}>{coach.Username}</Typography>
                <Typography variant="body2" color="text.secondary">Email: {coach.Email}</Typography>
                <Typography variant="body2" color="text.secondary">SĐT: {coach.PhoneNumber || 'Chưa cập nhật'}</Typography>
                <Box mt={2} display="flex" gap={2}>
                  <Button variant="contained" color="primary" onClick={() => navigate(`/chat-coach/${coach.Id}`)}>
                    Trò chuyện
                  </Button>
                  <Button variant="outlined" color="primary" onClick={() => navigate(`/book-consultation?coachId=${coach.Id}`)}>
                    Đặt lịch tư vấn
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ConsultCoachPage; 