import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper, 
  Typography,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import axios from 'axios';
import '../style/CoachDashboardPage.scss';
import facebookImage from "../assets/images/facebook.jpg";
import instagramImage from "../assets/images/instragram.jpg";

const CoachDashboardPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
      if (err.response) {
        if (err.response.status === 401) {
          setError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
          navigate('/login');
        } else if (err.response.status === 500) {
          setError('Lỗi hệ thống (500). Vui lòng thử lại sau hoặc liên hệ quản trị viên.');
        } else {
          setError(err.response.data?.message || 'Đã xảy ra lỗi không xác định.');
        }
        console.error('Lỗi khi tải danh sách thành viên được chỉ định:', err.response.data);
      } else {
        setError('Không thể kết nối đến máy chủ.');
        console.error('Lỗi khi tải danh sách thành viên được chỉ định:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedMembers();
  }, [navigate]);

  const handleCloseSnackbar = () => {
    setError('');
  };

  const handleConfirmAppointment = async (member) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/booking/${member.appointment.id}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(prevMembers => prevMembers.map(m => 
        m.Id === member.Id 
          ? { ...m, appointment: { ...m.appointment, status: 'đã xác nhận' } }
          : m
      ));
      // Re-fetch members to ensure up-to-date status
      fetchAssignedMembers();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xác nhận lịch hẹn.');
    }
  };

  const handleCancelAppointment = async (member) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/booking/${member.appointment.id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(prevMembers => prevMembers.map(m => 
        m.Id === member.Id 
          ? { ...m, appointment: { ...m.appointment, status: 'đã hủy' } }
          : m
      ));
      // Re-fetch members to ensure up-to-date status
      fetchAssignedMembers();
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
    return <span className={`badge bg-${config.color === 'warning' ? 'warning' : config.color === 'success' ? 'success' : 'danger'} text-dark`}>{config.label}</span>;
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 15, paddingTop: '20px', display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 15, paddingTop: '20px' }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
          👨‍💻 Lịch hẹn và tiến độ của thành viên
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Danh sách thành viên được chỉ định
        </Typography>
        {members.length === 0 ? (
          <div className="alert alert-info" role="alert">
            Bạn chưa có thành viên nào được chỉ định.
          </div>
        ) : (
          <div className="table-responsive mt-2">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Thành viên</th>
                  <th>Email</th>
                  <th>SĐT</th>
                  <th>Ngày hẹn</th>
                  <th>Trạng thái</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.Id}>
                    <td>
                      <p className="fw-semibold mb-0">{member.Username}</p>
                    </td>
                    <td>{member.Email}</td>
                    <td>{member.PhoneNumber}</td>
                    <td>
                      {member.appointment?.slotDate
                        ? `${new Date(member.appointment.slotDate).toLocaleDateString()} (${member.appointment.slot})`
                        : 'Không có lịch hẹn'}
                    </td>
                    <td>
                      {member.appointment?.status ? getStatusChip(member.appointment.status.toLowerCase()) : 'Không có lịch hẹn'}
                    </td>
                    <td className="text-end">
                      <div className="d-flex gap-1 justify-content-end">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => navigate(`/coach/member/${member.Id}/progress`)}
                        >
                          Xem tiến trình
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate(`/coach/chat/${member.Id}`)}
                        >
                          Chat
                        </button>
                        {member.appointment?.id && member.appointment.status?.toLowerCase() === 'đang chờ xác nhận' && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleConfirmAppointment(member)}
                            >
                              Xác nhận
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleCancelAppointment(member)}
                            >
                              Hủy
                            </button>
                          </>
                        )}
                        {member.appointment?.id && member.appointment.status?.toLowerCase() === 'đã xác nhận' && (
                          <>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleCancelAppointment(member)}
                            >
                              Hủy
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Paper>
      
      {error && (
        <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}
    </Container>
  );
};

export default CoachDashboardPage; 