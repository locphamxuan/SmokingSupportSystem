import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Typography, Box, Grid, Button } from '@mui/material';

const CoachMemberListPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Lấy danh sách member đã từng chat hoặc đặt lịch với coach
    axios.get('http://localhost:5000/api/consultations', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        // Lấy unique member từ danh sách lịch tư vấn
        const uniqueMembers = [];
        const seen = new Set();
        res.data.forEach(item => {
          if (!seen.has(item.MemberId)) {
            uniqueMembers.push({
              id: item.MemberId,
              name: item.MemberName,
              email: item.MemberEmail
            });
            seen.add(item.MemberId);
          }
        });
        setMembers(uniqueMembers);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) return <Typography align="center">Đang tải danh sách thành viên...</Typography>;

  return (
    <Box maxWidth={800} mx="auto" mt={4}>
      <Typography variant="h5" fontWeight="bold" mb={3} align="center">
        Thành viên bạn đang hỗ trợ
      </Typography>
      <Grid container spacing={2}>
        {members.length === 0 ? (
          <Grid item xs={12}>
            <Typography align="center" color="text.secondary">Chưa có thành viên nào</Typography>
          </Grid>
        ) : (
          members.map(member => (
            <Grid item xs={12} sm={6} key={member.id}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700}>{member.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{member.email}</Typography>
                  <Box mt={2}>
                    <Button variant="contained" onClick={() => navigate(`/coach-member/${member.id}`)}>
                      Xem chi tiết
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default CoachMemberListPage; 