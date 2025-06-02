import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Button, Box, Alert
} from '@mui/material';

const statusOptions = [
  { value: 'chua tu van', label: 'Chưa tư vấn' },
  { value: 'da tu van', label: 'Đã tư vấn' },
  { value: 'can theo doi', label: 'Cần theo dõi' }
];

const CoachPortalPage = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConsultations();
    // eslint-disable-next-line
  }, []);

  const fetchConsultations = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/consultations?coachId=' + user.id, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConsultations(res.data);
    } catch (err) {
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/consultations/${id}`, {
        status: 'da tu van'
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Xác nhận thành công!');
      fetchConsultations();
    } catch (err) {
      setError('Xác nhận thất bại!');
    }
  };

  if (loading) return <Typography align="center">Đang tải...</Typography>;

  return (
    <Box maxWidth={900} mx="auto" mt={4}>
      <Typography variant="h5" fontWeight="bold" mb={2} align="center">
        Danh sách thành viên đã đặt lịch tư vấn
      </Typography>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Thành viên</b></TableCell>
              <TableCell><b>Thời gian</b></TableCell>
              <TableCell><b>Trạng thái</b></TableCell>
              <TableCell><b>Hành động</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {consultations.map(item => (
              <TableRow key={item.Id}>
                <TableCell>
                  <Typography fontWeight="bold">{item.MemberUsername}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.MemberEmail}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.MemberPhone}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.MemberAddress}</Typography>
                </TableCell>
                <TableCell>{item.ScheduledTime}</TableCell>
                <TableCell>{statusOptions.find(opt => opt.value === item.Status)?.label || item.Status}</TableCell>
                <TableCell>
                  {item.Status === 'chua tu van' ? (
                    <Button variant="contained" color="success" onClick={() => handleConfirm(item.Id)}>
                      Xác nhận đã tư vấn
                    </Button>
                  ) : (
                    <Typography color="primary">Đã tư vấn</Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CoachPortalPage;
