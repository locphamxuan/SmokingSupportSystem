//danh sách đặt lịch của member ở trang coach

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
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/consultations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConsultations(res.data);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách:', err);
      setError('Không thể lấy danh sách lịch tư vấn');
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
      console.error('Lỗi khi xác nhận:', err);
      setError('Xác nhận thất bại!');
    }
  };

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <Typography align="center">Đang tải...</Typography>;

  return (
    <Box maxWidth={1200} mx="auto" mt={4} px={2}>
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
              <TableCell><b>Ghi chú</b></TableCell>
              <TableCell><b>Trạng thái</b></TableCell>
              <TableCell><b>Hành động</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {consultations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">Chưa có lịch tư vấn nào</Typography>
                </TableCell>
              </TableRow>
            ) : (
              consultations.map(item => (
                <TableRow key={item.Id}>
                  <TableCell>
                    <Typography fontWeight="bold">{item.MemberName}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.MemberEmail}</Typography>
                  </TableCell>
                  <TableCell>{formatDateTime(item.ScheduledTime)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {item.Note || 'Không có ghi chú'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      color={item.Status === 'da tu van' ? 'success.main' : 
                             item.Status === 'can theo doi' ? 'warning.main' : 'text.primary'}
                    >
                      {statusOptions.find(opt => opt.value === item.Status)?.label || item.Status}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {item.Status === 'chua tu van' ? (
                      <Button 
                        variant="contained" 
                        color="success" 
                        onClick={() => handleConfirm(item.Id)}
                        size="small"
                      >
                        Xác nhận đã tư vấn
                      </Button>
                    ) : (
                      <Typography color="success.main">Đã tư vấn</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CoachPortalPage;
