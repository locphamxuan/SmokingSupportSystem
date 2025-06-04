//trang đặt lịch với coach

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, Typography, Button, TextField, MenuItem, Box, Alert, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const BookConsultationPage = () => {
  const [coaches, setCoaches] = useState([]);
  const [coachId, setCoachId] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Kiểm tra đăng nhập
    if (!user) {
      setError('Vui lòng đăng nhập để sử dụng tính năng này!');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    // Kiểm tra member có gói premium không
    if (!user.isMember || user.role !== 'member') {
      setError('Bạn cần nâng cấp lên gói Premium để sử dụng tính năng này!');
      setTimeout(() => navigate('/subscription'), 2000);
      return;
    }

    axios.get('http://localhost:5000/api/coaches', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setCoaches(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token, user, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const coachIdParam = params.get('coachId');
    if (coachIdParam) setCoachId(coachIdParam);
  }, [location.search]);

  const handleBook = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Kiểm tra đăng nhập
    if (!user) {
      setError('Vui lòng đăng nhập để sử dụng tính năng này!');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    // Kiểm tra member có gói premium không
    if (!user.isMember || user.role !== 'member') {
      setError('Bạn cần nâng cấp lên gói Premium để sử dụng tính năng này!');
      setTimeout(() => navigate('/subscription'), 2000);
      return;
    }

    if (!coachId || !scheduledTime) {
      setError('Vui lòng chọn coach và thời gian!');
      return;
    }

    // Kiểm tra thời gian đặt lịch phải trong tương lai
    const scheduledDate = new Date(scheduledTime);
    const now = new Date();
    if (scheduledDate <= now) {
      setError('Thời gian tư vấn phải trong tương lai!');
      return;
    }

    try {
      const isoTime = new Date(scheduledTime).toISOString();
      await axios.post('http://localhost:5000/api/consultations', {
        memberId: user.id,
        coachId,
        scheduledTime: isoTime,
        note
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Đặt lịch thành công!');
      setTimeout(() => navigate('/consult-coach'), 1500);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Bạn cần nâng cấp lên gói Premium để sử dụng tính năng này!');
        setTimeout(() => navigate('/subscription'), 2000);
      } else if (err.response?.status === 400) {
        setError(err.response.data.message || 'Đặt lịch thất bại!');
      } else {
        setError('Đặt lịch thất bại!');
      }
    }
  };

  if (loading) return <div>Đang tải danh sách coach...</div>;

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Card sx={{ maxWidth: 450, width: '100%', p: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <IconButton onClick={() => navigate(-1)} color="primary">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ ml: 1, fontWeight: 600 }}>
              Đặt lịch tư vấn với Coach
            </Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <form onSubmit={handleBook}>
            <TextField
              select
              label="Chọn Coach"
              value={coachId}
              onChange={e => setCoachId(e.target.value)}
              fullWidth
              required
              margin="normal"
              disabled={!user?.isMember || user?.role !== 'member'}
            >
              <MenuItem value="">-- Chọn coach --</MenuItem>
              {coaches.map(coach => (
                <MenuItem key={coach.Id} value={coach.Id}>
                  {coach.Username} ({coach.Email})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Thời gian tư vấn"
              type="datetime-local"
              value={scheduledTime}
              onChange={e => setScheduledTime(e.target.value)}
              fullWidth
              required
              margin="normal"
              InputLabelProps={{ shrink: true }}
              disabled={!user?.isMember || user?.role !== 'member'}
            />
            <TextField
              label="Ghi chú"
              value={note}
              onChange={e => setNote(e.target.value)}
              fullWidth
              margin="normal"
              placeholder="Ghi chú (không bắt buộc)"
              disabled={!user?.isMember || user?.role !== 'member'}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3, py: 1.5, fontWeight: 600 }}
              disabled={!user?.isMember || user?.role !== 'member'}
            >
              Đặt lịch
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BookConsultationPage; 