import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Button, CircularProgress, 
  Alert, Snackbar, Chip, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CoachDashboardPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssignedMembers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await axios.get('http://localhost:5000/api/hlv/members', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMembers(response.data.members);
      } catch (err) {
        console.error('Lỗi khi tải danh sách thành viên được chỉ định:', err);
        setError(err.response?.data?.message || 'Không thể tải danh sách thành viên được chỉ định.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedMembers();
  }, [navigate]);

  const handleCloseSnackbar = () => {
    setError('');
  };

  const handleConfirmAppointment = async (member) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/bookings/${member.appointment.id}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(prevMembers => prevMembers.map(m => 
        m.Id === member.Id 
          ? { ...m, appointment: { ...m.appointment, status: 'đã xác nhận' } }
          : m
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xác nhận lịch hẹn.');
    }
  };

  const handleCancelAppointment = async (member) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/bookings/${member.appointment.id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(prevMembers => prevMembers.map(m => 
        m.Id === member.Id 
          ? { ...m, appointment: { ...m.appointment, status: 'đã hủy' } }
          : m
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể hủy lịch hẹn.');
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      'đang chờ xác nhận': { label: 'Đang chờ', color: 'warning' },
      'đã xác nhận': { label: 'Đã xác nhận', color: 'success' },
      'đã hủy': { label: 'Đã hủy', color: 'error' },
    };
    const config = statusConfig[status] || statusConfig['đang chờ xác nhận'];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
          👨‍💻 Lịch hẹn và tiến độ của thành viên
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Danh sách thành viên được chỉ định
        </Typography>
        {error && (
          <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
            <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          </Snackbar>
        )}
        {members.length === 0 ? (
          <Alert severity="info">Bạn chưa có thành viên nào được chỉ định.</Alert>
        ) : (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Thành viên</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>SĐT</TableCell>
                  <TableCell>Ngày hẹn</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.Id}>
                    <TableCell>
                      <Typography variant="subtitle1">{member.Username}</Typography>
                    </TableCell>
                    <TableCell>{member.Email}</TableCell>
                    <TableCell>{member.PhoneNumber}</TableCell>
                    <TableCell>
                      {new Date(member.CreatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(member.appointment?.status?.toLowerCase() || 'đang chờ xác nhận')}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => navigate(`/coach/member/${member.Id}/progress`)}
                        >
                          Xem tiến trình
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => navigate(`/coach/chat/${member.Id}`)}
                          sx={{ minWidth: '80px' }}
                        >
                          Chat
                        </Button>
                        {member.appointment?.status?.toLowerCase() === 'đang chờ xác nhận' && (
                          <>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => handleConfirmAppointment(member)}
                            >
                              Xác nhận
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => handleCancelAppointment(member)}
                            >
                              Hủy
                            </Button>
                          </>
                        )}
                        {member.appointment?.status?.toLowerCase() === 'đã xác nhận' && (
                          <>
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => handleCancelAppointment(member)}
                            >
                              Hủy
                            </Button>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default CoachDashboardPage; 