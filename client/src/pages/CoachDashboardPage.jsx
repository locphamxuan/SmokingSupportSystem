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
import 'bootstrap/dist/css/bootstrap.min.css';
// Thêm service gọi API lấy/gán kế hoạch mẫu
const getMyQuitPlanTemplates = async () => {
  const token = localStorage.getItem('token');
  const res = await axios.get('http://localhost:5000/api/coach/my-quit-plan-templates', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.templates;
};

const assignQuitPlanToUser = async ({ userId, templateId, startDate, targetDate }) => {
  const token = localStorage.getItem('token');
  const res = await axios.post('http://localhost:5000/api/coach/assign-quit-plan', {
    userId, templateId, startDate, targetDate
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};
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
  const [acceptedBookings, setAcceptedBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [errorBookings, setErrorBookings] = useState('');
  const [availableBookings, setAvailableBookings] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(true);
  const [errorAvailable, setErrorAvailable] = useState('');
  // State cho modal chọn kế hoạch mẫu
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planTemplates, setPlanTemplates] = useState([]);
  const [selectedPlanTemplate, setSelectedPlanTemplate] = useState(null);
  const [planAssignBooking, setPlanAssignBooking] = useState(null);
  const [planStartDate, setPlanStartDate] = useState('');
  const [planTargetDate, setPlanTargetDate] = useState('');
  // State cho modal chọn thành viên để gửi kế hoạch
  const [showMemberSelectModal, setShowMemberSelectModal] = useState(false);
  const [selectedMemberForPlan, setSelectedMemberForPlan] = useState(null);

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

  // Đưa 2 hàm fetchAcceptedBookings và fetchAvailableBookings ra ngoài useEffect để có thể gọi lại
  const fetchAcceptedBookings = async () => {
    setLoadingBookings(true);
    setErrorBookings('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/booking/accepted', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAcceptedBookings(res.data.bookings || []);
    } catch (err) {
      setErrorBookings('Không thể tải lịch hẹn đã nhận.');
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchAvailableBookings = async () => {
    setLoadingAvailable(true);
    setErrorAvailable('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/booking/available', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableBookings(res.data.bookings || []);
    } catch (err) {
      setErrorAvailable('Không thể tải lịch hẹn có thể nhận.');
    } finally {
      setLoadingAvailable(false);
    }
  };

  // useEffect để load lịch đã nhận
  useEffect(() => {
    fetchAcceptedBookings();
  }, []);

  // useEffect để load lịch đã thanh toán (chưa nhận), reload khi acceptedBookings thay đổi
  useEffect(() => {
    fetchAvailableBookings();
  }, [acceptedBookings]);

  // Hàm nhận lịch
  const handleAcceptBooking = async (bookingId) => {
    if (!window.confirm('Bạn chắc chắn muốn nhận lịch hẹn này?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/booking/${bookingId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Sau khi nhận lịch, reload lại danh sách
      await fetchAcceptedBookings();
      await fetchAvailableBookings();
      setSuccess('Nhận lịch thành công!');
      // Lấy thông tin booking vừa nhận để lấy userId
      const booking = availableBookings.find(b => b.Id === bookingId);
      if (booking) {
        setPlanAssignBooking(booking);
        setShowPlanModal(true);
        setPlanStartDate(booking.SlotDate ? booking.SlotDate.slice(0, 10) : '');
        setPlanTargetDate('');
        // Lấy danh sách template
        const templates = await getMyQuitPlanTemplates();
        setPlanTemplates(templates);
      }
    } catch (err) {
      alert('Không thể nhận lịch hẹn.');
    }
  };

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
          ? { ...m, appointment: { ...m.appointment, status: 'coach đã hủy' } }
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
      'khách hàng đã hủy': { label: 'Khách hàng đã hủy', color: 'secondary' }, // Coach xem lịch member đã hủy
      'coach đã hủy': { label: 'Bạn đã hủy', color: 'danger' }, // Coach xem lịch mình đã hủy
    };
    const config = statusConfig[status] || statusConfig['đang chờ xác nhận'];
    const colorClass = config.color === 'warning' ? 'warning' : 
                      config.color === 'success' ? 'success' : 
                      config.color === 'secondary' ? 'secondary' : 'danger';
    return <span className={`badge bg-${colorClass} ${config.color === 'warning' ? 'text-dark' : ''}`}>{config.label}</span>;
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

  // Lọc availableBookings để không hiển thị các booking đã nhận
  const filteredAvailableBookings = availableBookings.filter(
    (booking) => !acceptedBookings.some((ab) => ab.Id === booking.Id)
  );

  // Lấy danh sách thành viên duy nhất từ acceptedBookings
  const uniqueAcceptedMembers = Array.from(
    new Map(acceptedBookings.map(b => [b.MemberId, b])).values()
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 15, paddingTop: '20px' }}>
      {members.length !== 0 && (
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
        
        <Divider />
        <MenuItem onClick={() => {
          handleOpenBadgeModal(menuMember);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <BadgeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Trao huy hiệu</ListItemText>
        </MenuItem>
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
      
      {/* Modal chọn kế hoạch mẫu */}
      <Dialog open={showPlanModal} onClose={() => setShowPlanModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Gửi kế hoạch cai thuốc cho thành viên</DialogTitle>
        <DialogContent>
          {planTemplates.length === 0 ? (
            <div>Không có kế hoạch mẫu nào.</div>
          ) : (
            <>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Chọn kế hoạch mẫu</InputLabel>
                <Select
                  value={selectedPlanTemplate ? selectedPlanTemplate.Id : ''}
                  label="Chọn kế hoạch mẫu"
                  onChange={e => {
                    const plan = planTemplates.find(p => p.Id === e.target.value);
                    setSelectedPlanTemplate(plan);
                  }}
                >
                  {planTemplates.map(plan => (
                    <MenuItem key={plan.Id} value={plan.Id}>
                      <b>{plan.Title}</b> - {plan.Description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedPlanTemplate && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography variant="h6" sx={{ color: 'primary.main' }}>{selectedPlanTemplate.Title}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedPlanTemplate.Description}</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mt: 1 }}>{selectedPlanTemplate.PlanDetail}</Typography>
                </Box>
              )}
              <TextField
                label="Ngày bắt đầu"
                type="date"
                value={planStartDate}
                onChange={e => setPlanStartDate(e.target.value)}
                sx={{ mb: 2, mr: 2 }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Ngày kết thúc"
                type="date"
                value={planTargetDate}
                onChange={e => setPlanTargetDate(e.target.value)}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPlanModal(false)}>Hủy</Button>
          <Button
            variant="contained"
            disabled={!selectedPlanTemplate || !planStartDate || !planTargetDate}
            onClick={async () => {
              try {
                await assignQuitPlanToUser({
                  userId: planAssignBooking.MemberId,
                  templateId: selectedPlanTemplate.Id,
                  startDate: planStartDate,
                  targetDate: planTargetDate
                });
                setSuccess('Đã gửi kế hoạch cai thuốc cho thành viên!');
                setShowPlanModal(false);
              } catch (err) {
                setError('Lỗi khi gửi kế hoạch.');
              }
            }}
          >
            Gửi kế hoạch
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal chọn thành viên để gửi kế hoạch */}
      <Dialog open={showMemberSelectModal} onClose={() => setShowMemberSelectModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Chọn thành viên để gửi kế hoạch</DialogTitle>
        <DialogContent>
          {uniqueAcceptedMembers.length === 0 ? (
            <div>Không có thành viên nào đã nhận lịch.</div>
          ) : (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Chọn thành viên</InputLabel>
              <Select
                value={selectedMemberForPlan ? selectedMemberForPlan.MemberId : ''}
                label="Chọn thành viên"
                onChange={e => {
                  const member = uniqueAcceptedMembers.find(b => b.MemberId === e.target.value);
                  setSelectedMemberForPlan(member);
                }}
              >
                {uniqueAcceptedMembers.map(b => (
                  <MenuItem key={b.MemberId} value={b.MemberId}>
                    {b.MemberName || b.MemberId}
                    {b.MemberEmail ? ` (${b.MemberEmail})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMemberSelectModal(false)}>Hủy</Button>
          <Button
            variant="contained"
            disabled={!selectedMemberForPlan}
            onClick={async () => {
              setShowMemberSelectModal(false);
              // Hiện modal chọn kế hoạch mẫu cho member này
              setPlanAssignBooking(selectedMemberForPlan);
              setShowPlanModal(true);
              setPlanStartDate(selectedMemberForPlan.SlotDate ? new Date(selectedMemberForPlan.SlotDate).toISOString().slice(0, 10) : '');
              setPlanTargetDate('');
              const templates = await getMyQuitPlanTemplates();
              setPlanTemplates(templates);
            }}
          >
            Tiếp tục
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

      <h3 className="mb-3">Lịch hẹn đã thanh toán (chưa nhận)</h3>
      {loadingAvailable ? (
        <div>Đang tải lịch hẹn...</div>
      ) : errorAvailable ? (
        <div className="text-danger">{errorAvailable}</div>
      ) : filteredAvailableBookings.length === 0 ? (
        <div className="alert alert-info">Không có lịch hẹn nào đang chờ nhận.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Ngày hẹn</th>
                <th>Khung giờ</th>
                <th>Thành viên</th>
                <th>Ghi chú</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredAvailableBookings.map(booking => (
                <tr key={booking.Id}>
                  <td>{new Date(booking.SlotDate).toLocaleDateString('vi-VN')}</td>
                  <td>{booking.Slot}</td>
                  <td>{booking.MemberId}</td>
                  <td>{booking.Note || <i>Không có</i>}</td>
                  <td>
                    <button className="btn btn-success btn-sm" onClick={() => handleAcceptBooking(booking.Id)}>
                      Nhận lịch
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="mb-3">Lịch hẹn đã nhận</h3>
      <div className="mb-3">
        <Button variant="contained" color="success" onClick={() => setShowMemberSelectModal(true)}>
          Gửi kế hoạch cai thuốc
        </Button>
      </div>
      {loadingBookings ? (
        <div>Đang tải lịch hẹn...</div>
      ) : errorBookings ? (
        <div className="text-danger">{errorBookings}</div>
      ) : acceptedBookings.length === 0 ? (
        <div className="alert alert-info">Bạn chưa nhận lịch hẹn nào.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Ngày hẹn</th>
                <th>Khung giờ</th>
                <th>Thành viên</th>
                <th>Ghi chú</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {acceptedBookings.map(booking => (
                <tr key={booking.Id}>
                  <td>{new Date(booking.SlotDate).toLocaleDateString('vi-VN')}</td>
                  <td>{booking.Slot}</td>
                  <td>{booking.MemberName}</td>
                  <td>{booking.Note || <i>Không có</i>}</td>
                  <td>{booking.Status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
};

export default CoachDashboardPage; 