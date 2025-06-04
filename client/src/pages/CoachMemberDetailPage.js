import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Button, TextField, Grid, Alert } from '@mui/material';

const CoachMemberDetailPage = () => {
  const { memberId } = useParams();
  const [quitPlan, setQuitPlan] = useState(null);
  const [progress, setProgress] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestion, setSuggestion] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [selectedProgressId, setSelectedProgressId] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchQuitPlan();
    fetchProgress();
    fetchSuggestions();
    // eslint-disable-next-line
  }, [memberId]);

  const fetchQuitPlan = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/coaches/member/${memberId}/quit-plan`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuitPlan(res.data.quitPlan);
    } catch {}
  };

  const fetchProgress = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/coaches/member/${memberId}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProgress(res.data.progress);
    } catch {}
  };

  const fetchSuggestions = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/coaches/member/${memberId}/suggestions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuggestions(res.data.suggestions);
    } catch {}
  };

  const handleSendSuggestion = async () => {
    setError(''); setSuccess('');
    if (!suggestion.trim()) {
      setError('Vui lòng nhập nội dung đề xuất!');
      return;
    }
    try {
      await axios.post(`http://localhost:5000/api/coaches/member/${memberId}/suggestion`, { suggestion }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Đã gửi đề xuất!');
      setSuggestion('');
      fetchSuggestions();
    } catch {
      setError('Gửi đề xuất thất bại!');
    }
  };

  const handleAddNote = async (progressId) => {
    setError(''); setSuccess('');
    if (!note.trim()) {
      setError('Vui lòng nhập ghi chú!');
      return;
    }
    try {
      await axios.post(`http://localhost:5000/api/coaches/member/${memberId}/progress/${progressId}/note`, { note }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Đã lưu ghi chú!');
      setNote('');
      setSelectedProgressId(null);
      fetchProgress();
    } catch {
      setError('Lưu ghi chú thất bại!');
    }
  };

  return (
    <Box maxWidth={1000} mx="auto" mt={4}>
      <Typography variant="h5" fontWeight="bold" mb={2} align="center">
        Tiến trình của thành viên
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {/* Kế hoạch cai thuốc */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700}>Kế hoạch cai thuốc</Typography>
          {quitPlan ? (
            <Box mt={1}>
              <Typography>Bắt đầu: {quitPlan.startDate}</Typography>
              <Typography>Kết thúc: {quitPlan.targetDate}</Typography>
              <Typography>Loại kế hoạch: {quitPlan.planType}</Typography>
              <Typography>Số điếu ban đầu: {quitPlan.initialCigarettes}</Typography>
              <Typography>Giảm mỗi ngày: {quitPlan.dailyReduction}</Typography>
              <Typography>Chi tiết: {quitPlan.planDetail}</Typography>
              <Typography>Tiến độ hiện tại: {quitPlan.currentProgress}</Typography>
            </Box>
          ) : <Typography color="text.secondary">Chưa có kế hoạch</Typography>}
        </CardContent>
      </Card>
      {/* Tiến trình */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700}>Tiến trình</Typography>
          {progress.length === 0 ? (
            <Typography color="text.secondary">Chưa có tiến trình nào</Typography>
          ) : (
            <Grid container spacing={2}>
              {progress.map(item => (
                <Grid item xs={12} md={6} key={item.Id}>
                  <Box border={1} borderRadius={2} p={2} mb={1} borderColor="#e0e0e0">
                    <Typography>Ngày: {item.Date}</Typography>
                    <Typography>Số điếu: {item.Cigarettes}</Typography>
                    <Typography>Số tiền: {item.MoneySpent}</Typography>
                    <Typography>Ghi chú thành viên: {item.Note}</Typography>
                    <Typography>Ghi chú coach: {item.CoachNote || 'Chưa có'}</Typography>
                    {selectedProgressId === item.Id ? (
                      <Box mt={1}>
                        <TextField
                          label="Ghi chú cho tiến trình này"
                          value={note}
                          onChange={e => setNote(e.target.value)}
                          fullWidth
                          multiline
                          rows={2}
                        />
                        <Button variant="contained" sx={{ mt: 1 }} onClick={() => handleAddNote(item.Id)}>
                          Lưu ghi chú
                        </Button>
                        <Button sx={{ mt: 1, ml: 1 }} onClick={() => { setSelectedProgressId(null); setNote(''); }}>
                          Hủy
                        </Button>
                      </Box>
                    ) : (
                      <Button size="small" sx={{ mt: 1 }} onClick={() => setSelectedProgressId(item.Id)}>
                        Thêm/Sửa ghi chú
                      </Button>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
      {/* Đề xuất điều chỉnh kế hoạch */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700}>Đề xuất điều chỉnh kế hoạch</Typography>
          <Box display="flex" gap={2} mt={1}>
            <TextField
              label="Nội dung đề xuất"
              value={suggestion}
              onChange={e => setSuggestion(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <Button variant="contained" onClick={handleSendSuggestion} sx={{ minWidth: 150 }}>
              Gửi đề xuất
            </Button>
          </Box>
          <Box mt={2}>
            <Typography fontWeight={600}>Lịch sử đề xuất</Typography>
            {suggestions.length === 0 ? (
              <Typography color="text.secondary">Chưa có đề xuất nào</Typography>
            ) : (
              suggestions.map(sug => (
                <Box key={sug.Id} borderBottom={1} borderColor="#e0e0e0" py={1}>
                  <Typography>- {sug.Suggestion} <span style={{ color: '#888', fontSize: 13 }}>({new Date(sug.CreatedAt).toLocaleString('vi-VN')})</span></Typography>
                  <Typography variant="caption" color="text.secondary">Trạng thái: {sug.Status}</Typography>
                </Box>
              ))
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CoachMemberDetailPage; 