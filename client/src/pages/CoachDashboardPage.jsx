import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper, 
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Chat as ChatIcon,
  EmojiEvents as BadgeIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import axios from 'axios';
import '../style/CoachDashboardPage.scss';
import facebookImage from "../assets/images/facebook.jpg";
import instagramImage from "../assets/images/instragram.jpg";

const CoachDashboardPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [allBadges, setAllBadges] = useState([]);
  const [openBadgeModal, setOpenBadgeModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState('');
  const [badgeReason, setBadgeReason] = useState('');
  const [awardingBadge, setAwardingBadge] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuMember, setMenuMember] = useState(null);
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

  const fetchAllBadges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/auth/all-badges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllBadges(response.data.badges || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách huy hiệu:', err);
    }
  };

  useEffect(() => {
    fetchAssignedMembers();
    fetchAllBadges();
  }, [navigate]);

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
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

  const handleOpenBadgeModal = (member) => {
    setSelectedMember(member);
    setSelectedBadge('');
    setBadgeReason('');
    setOpenBadgeModal(true);
  };

  const handleCloseBadgeModal = () => {
    setOpenBadgeModal(false);
    setSelectedMember(null);
    setSelectedBadge('');
    setBadgeReason('');
  };

  const handleAwardBadge = async () => {
    if (!selectedBadge || !selectedMember) {
      setError('Vui lòng chọn huy hiệu để trao!');
      return;
    }

    try {
      setAwardingBadge(true);
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/hlv/award-badge', {
        memberId: selectedMember.Id,
        badgeId: selectedBadge,
        reason: badgeReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(response.data.message);
      handleCloseBadgeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi trao huy hiệu');
    } finally {
      setAwardingBadge(false);
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

  const handleMenuOpen = (event, member) => {
    setAnchorEl(event.currentTarget);
    setMenuMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuMember(null);
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
                  <th>Loại</th>
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
                      {member.IsMemberVip ? (
                        <Chip 
                          label="VIP" 
                          color="warning" 
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      ) : (
                        <Chip 
                          label="Thường" 
                          color="default" 
                          size="small"
                        />
                      )}
                    </td>
                    <td>
                      {member.appointment?.slotDate
                        ? `${new Date(member.appointment.slotDate).toLocaleDateString()} (${member.appointment.slot})`
                        : 'Không có lịch hẹn'}
                    </td>
                    <td>
                      {member.appointment?.status ? getStatusChip(member.appointment.status.toLowerCase()) : 'Không có lịch hẹn'}
                    </td>
                    <td className="text-end">
                      <div className="d-flex gap-1 justify-content-end align-items-center">
                        {/* Primary Action - Chat (most important) */}
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<ChatIcon />}
                          onClick={() => navigate(`/coach/chat/${member.Id}`)}
                          sx={{ minWidth: 'auto', px: 1.5 }}
                        >
                          Chat
                        </Button>

                        {/* Appointment Status Actions */}
                        {member.appointment?.id && member.appointment.status?.toLowerCase() === 'đang chờ xác nhận' && (
                          <>
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              startIcon={<CheckIcon />}
                              onClick={() => handleConfirmAppointment(member)}
                              sx={{ minWidth: 'auto', px: 1 }}
                            >
                              Xác nhận
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<CloseIcon />}
                              onClick={() => handleCancelAppointment(member)}
                              sx={{ minWidth: 'auto', px: 1 }}
                            >
                              Hủy
                            </Button>
                          </>
                        )}
                        
                        {member.appointment?.id && member.appointment.status?.toLowerCase() === 'đã xác nhận' && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CloseIcon />}
                            onClick={() => handleCancelAppointment(member)}
                            sx={{ minWidth: 'auto', px: 1 }}
                          >
                            Hủy lịch
                          </Button>
                        )}

                        {/* More Actions Menu */}
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, member)}
                          sx={{ ml: 0.5 }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Paper>
      
      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem onClick={() => {
          navigate(`/coach/member/${menuMember?.Id}/progress`);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Xem tiến trình</ListItemText>
        </MenuItem>
        
        {menuMember?.IsMemberVip && (
          <>
            <Divider />
            <MenuItem onClick={() => {
              handleOpenBadgeModal(menuMember);
              handleMenuClose();
            }}>
              <ListItemIcon>
                <BadgeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Trao huy hiệu VIP</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
      
      {/* Badge Award Modal */}
      <Dialog open={openBadgeModal} onClose={handleCloseBadgeModal} maxWidth="md" fullWidth>
        <DialogTitle>
          🎖️ Trao huy hiệu cho {selectedMember?.Username}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Chọn huy hiệu</InputLabel>
              <Select
                value={selectedBadge}
                label="Chọn huy hiệu"
                onChange={(e) => setSelectedBadge(e.target.value)}
              >
                {allBadges.map((badge) => (
                  <MenuItem key={badge.Id} value={badge.Id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <span>{badge.Name}</span>
                      <Chip 
                        label={`Yêu cầu: ${badge.Requirement} ngày`} 
                        size="small" 
                        color="info"
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {selectedBadge && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                {(() => {
                  const badge = allBadges.find(b => b.Id === selectedBadge);
                  return badge ? (
                    <>
                      <Typography variant="h6" sx={{ color: 'primary.main' }}>
                        {badge.Name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {badge.Description}
                      </Typography>
                    </>
                  ) : null;
                })()}
              </Box>
            )}
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Lý do trao huy hiệu (tùy chọn)"
              value={badgeReason}
              onChange={(e) => setBadgeReason(e.target.value)}
              placeholder="Ví dụ: Hoàn thành mục tiêu tuần này xuất sắc, rất cố gắng trong quá trình cai thuốc..."
              helperText="Thành viên sẽ nhận được thông báo kèm lý do này"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBadgeModal}>
            Hủy
          </Button>
          <Button 
            onClick={handleAwardBadge} 
            variant="contained" 
            disabled={!selectedBadge || awardingBadge}
            startIcon={awardingBadge ? <CircularProgress size={20} /> : '🎖️'}
          >
            {awardingBadge ? 'Đang trao...' : 'Trao huy hiệu'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {error && (
        <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}
      
      {success && (
        <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
      )}
    </Container>
  );
};

export default CoachDashboardPage; 