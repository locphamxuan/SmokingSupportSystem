import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../style/BookingPage.scss'; // Assuming you'll create this file for custom styles
import 'bootstrap/dist/css/bootstrap.min.css';

const BookingPage = () => {
  const navigate = useNavigate();
  const [slotDate, setSlotDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [note, setNote] = useState('');
  const [coaches, setCoaches] = useState([]);
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bookingHistory, setBookingHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Available time slots as defined in the database
  const availableSlots = [
    { value: '7h-9h', label: '7:00 - 9:00' },
    { value: '10h-12h', label: '10:00 - 12:00' },
    { value: '13h-15h', label: '13:00 - 15:00' },
    { value: '16h-18h', label: '16:00 - 18:00' }
  ];

  // Fetch booking history
  const fetchBookingHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping booking history fetch');
        setHistoryLoading(false);
        return;
      }

      console.log('Fetching booking history...');
      const response = await axios.get('http://localhost:5000/api/booking/history', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Booking history response:', response.data);
      console.log('Bookings array:', response.data.bookings);
      
      setBookingHistory(response.data.bookings || []);
    } catch (err) {
      console.error('Lỗi khi tải lịch sử đặt lịch:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setError(`Lỗi khi tải lịch sử đặt lịch: ${err.response?.data?.message || err.message}`);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserAndCoaches = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // First, get user profile to check assigned coach
        const profileResponse = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("BookingPage - User Profile:", profileResponse.data);
        setUserProfile(profileResponse.data);

        // Check if user has permission to book appointments
        if (profileResponse.data.role !== 'memberVip' || !profileResponse.data.isMemberVip) {
          setError('Chỉ thành viên VIP đã mua gói mới có thể đặt lịch tư vấn.');
          setLoading(false);
          return;
        }

        // If user has assigned coach, use that coach
        if (profileResponse.data.coachId) {
          setSelectedCoachId(profileResponse.data.coachId);
          // Set the coach info for display
          setCoaches([{
            Id: profileResponse.data.coachId,
            Username: profileResponse.data.coach?.Username || `Coach ID: ${profileResponse.data.coachId}`
          }]);
        } else {
          // If no assigned coach, get all coaches
          const response = await axios.get('http://localhost:5000/api/auth/coaches', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCoaches(response.data.coaches);
          if (response.data.coaches.length > 0) {
            setSelectedCoachId(response.data.coaches[0].Id);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin:', err);
        setError(err.response?.data?.message || 'Không thể tải thông tin.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndCoaches();
    fetchBookingHistory();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      if (!selectedCoachId || isNaN(Number(selectedCoachId))) {
        setError('Vui lòng chọn một huấn luyện viên.');
        return;
      }
      if (!slotDate) {
        setError('Vui lòng chọn ngày hẹn.');
        return;
      }
      if (!selectedSlot) {
        setError('Vui lòng chọn khung giờ hẹn.');
        return;
      }

      // Check if booking time is valid
      const selectedDate = new Date(slotDate);
      const currentDate = new Date();
      const isToday = selectedDate.toDateString() === currentDate.toDateString();
      
      if (isToday) {
        const currentHour = currentDate.getHours();
        const selectedSlotEndHour = getSlotEndHour(selectedSlot);
        
        if (currentHour >= selectedSlotEndHour) {
          setError(`Không thể đặt lịch cho khung giờ ${getSlotLabel(selectedSlot)} vì đã qua giờ này. Vui lòng chọn khung giờ khác hoặc ngày khác.`);
          return;
        }
      }

      const response = await axios.post('http://localhost:5000/api/booking/book-appointment', {
        coachId: Number(selectedCoachId),
        slotDate,
        slot: selectedSlot,
        note
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("BookingPage - Booking response:", response.data);
      setSuccess('Lịch hẹn của bạn đã được gửi thành công!');
      
      // Refresh booking history after successful booking
      fetchBookingHistory();
      
      // Reset form
      setSlotDate('');
      setSelectedSlot('');
      setNote('');
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Lỗi khi đặt lịch hẹn:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Không thể đặt lịch hẹn. Vui lòng thử lại.');
    }
  };

  // Helper function to get slot end hour
  const getSlotEndHour = (slot) => {
    const slotMap = {
      '7h-9h': 9,
      '10h-12h': 12,
      '13h-15h': 15,
      '16h-18h': 18
    };
    return slotMap[slot] || 0;
  };

  // Helper function to get slot label
  const getSlotLabel = (slot) => {
    const slotMap = {
      '7h-9h': '7:00 - 9:00',
      '10h-12h': '10:00 - 12:00',
      '13h-15h': '13:00 - 15:00',
      '16h-18h': '16:00 - 18:00'
    };
    return slotMap[slot] || slot;
  };

  // Filter available slots based on current time if booking for today
  const getAvailableSlots = () => {
    const selectedDate = new Date(slotDate);
    const currentDate = new Date();
    const isToday = selectedDate.toDateString() === currentDate.toDateString();
    
    if (!isToday) {
      return availableSlots;
    }
    
    const currentHour = currentDate.getHours();
    return availableSlots.filter(slot => {
      const slotEndHour = getSlotEndHour(slot.value);
      return currentHour < slotEndHour;
    });
  };

  // Handle date change and validate selected slot
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSlotDate(newDate);
    
    // If a slot is selected, check if it's still available for the new date
    if (selectedSlot && newDate) {
      const newSelectedDate = new Date(newDate);
      const currentDate = new Date();
      const isToday = newSelectedDate.toDateString() === currentDate.toDateString();
      
      if (isToday) {
        const currentHour = currentDate.getHours();
        const selectedSlotEndHour = getSlotEndHour(selectedSlot);
        
        if (currentHour >= selectedSlotEndHour) {
          setSelectedSlot(''); // Reset slot selection
          setError('Khung giờ đã chọn không còn khả dụng cho ngày này. Vui lòng chọn khung giờ khác.');
          setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
        }
      }
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Helper function to display status text for member view
  const getDisplayStatus = (status) => {
    switch (status) {
      case 'đang chờ xác nhận':
        return 'Đang chờ xác nhận';
      case 'đã xác nhận':
        return 'Đã xác nhận';
      case 'khách hàng đã hủy':
        return 'Bạn đã hủy'; // Member xem lịch mình đã hủy
      case 'coach đã hủy':
        return 'Coach đã hủy'; // Member xem lịch coach đã hủy
      default:
        return status;
    }
  };

  // Helper function to get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'đang chờ xác nhận':
        return 'badge bg-warning text-dark';
      case 'đã xác nhận':
        return 'badge bg-success';
      case 'khách hàng đã hủy':
        return 'badge bg-secondary';
      case 'coach đã hủy':
        return 'badge bg-danger';
      default:
        return 'badge bg-primary';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Show error if no access permission
  if (userProfile && (userProfile.role !== 'memberVip' || !userProfile.isMemberVip)) {
    return (
      <div className="booking-page-wrapper">
        <div className="booking-page-container">
          <div className="d-flex align-items-center mb-3">
            <button
              onClick={() => navigate('/my-progress')}
              className="btn btn-outline-success me-2"
            >
              <i className="fas fa-arrow-left me-2"></i> Quay lại
            </button>
          </div>

          <div className="card p-4 shadow-sm text-center">
            <h2 className="mb-4 text-danger">
              <i className="fas fa-lock me-2"></i> Không có quyền truy cập
            </h2>
            <div className="alert alert-warning">
              <h4>Chỉ thành viên VIP đã mua gói mới có thể đặt lịch tư vấn!</h4>
              <p>Để đặt lịch hẹn với huấn luyện viên, bạn cần:</p>
              <ul className="list-unstyled">
                <li>✓ Nâng cấp tài khoản lên VIP</li>
                <li>✓ Mua gói thành viên</li>
              </ul>
              <button 
                className="btn btn-success me-2"
                onClick={() => navigate('/subscribe')}
              >
                <i className="fas fa-crown me-2"></i>Nâng cấp VIP
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => navigate('/my-progress')}
              >
                <i className="fas fa-arrow-left me-2"></i>Quay lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page-wrapper">
      <div className="booking-page-container">
        <div className="d-flex align-items-center mb-3">
          <button
            onClick={() => navigate('/my-progress')}
            className="btn btn-outline-success me-2"
          >
            <i className="fas fa-arrow-left me-2"></i> Quay lại
          </button>
        </div>

        <h4 className="mb-3 fw-bold text-success">Đặt lịch hẹn với Huấn luyện viên</h4>
        
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError('')}
              aria-label="Close"
            ></button>
          </div>
        )}
        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {success}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setSuccess('')}
              aria-label="Close"
            ></button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="mb-3">
            <label htmlFor="coachSelect" className="form-label">Huấn luyện viên được chỉ định</label>
            <select
              className="form-select"
              id="coachSelect"
              value={selectedCoachId}
              onChange={(e) => setSelectedCoachId(e.target.value)}
              disabled={coaches.length === 1} // Disable if only one coach (assigned coach)
              required
            >
              {coaches.map((coach) => (
                <option key={coach.Id} value={coach.Id}>
                  {coach.Username}
                </option>
              ))}
            </select>
            {coaches.length === 1 && (
              <small className="form-text text-muted">
                Đây là huấn luyện viên được phân công cho bạn.
              </small>
            )}
          </div>
          <div className="mb-3">
            <label htmlFor="slotDate" className="form-label">Ngày hẹn</label>
            <input
              type="date"
              className="form-control"
              id="slotDate"
              value={slotDate}
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]} // Prevent booking in the past
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="slotSelect" className="form-label">Khung giờ hẹn</label>
            <select
              className="form-select"
              id="slotSelect"
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              required
            >
              <option value="">Chọn khung giờ</option>
              {getAvailableSlots().map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
            {slotDate && (() => {
              const selectedDate = new Date(slotDate);
              const currentDate = new Date();
              const isToday = selectedDate.toDateString() === currentDate.toDateString();
              const availableCount = getAvailableSlots().length;
              const totalCount = availableSlots.length;
              
              if (isToday && availableCount < totalCount) {
                return (
                  <small className="form-text text-warning">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    Một số khung giờ đã qua và không thể đặt lịch cho hôm nay. 
                    Hiện có {availableCount}/{totalCount} khung giờ khả dụng.
                  </small>
                );
              }
              if (isToday && availableCount === 0) {
                return (
                  <small className="form-text text-danger">
                    <i className="fas fa-times-circle me-1"></i>
                    Tất cả khung giờ hôm nay đã qua. Vui lòng chọn ngày khác.
                  </small>
                );
              }
              return null;
            })()}
          </div>
          <div className="mb-3">
            <label htmlFor="note" className="form-label">Ghi chú (Tùy chọn)</label>
            <textarea
              className="form-control"
              id="note"
              rows="3"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            ></textarea>
          </div>
          <button type="submit" className="btn btn-success">Gửi yêu cầu đặt lịch</button>
        </form>

        {/* Booking History Section */}
        <div className="booking-history">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0 fw-bold text-success">Lịch sử đặt lịch</h4>
            <div>
              <button 
                className="btn btn-outline-success btn-sm"
                onClick={fetchBookingHistory}
              >
                <i className="fas fa-refresh me-1"></i>
                Tải lại
              </button>
            </div>
          </div>
          {historyLoading ? (
            <div className="d-flex justify-content-center">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : bookingHistory.length === 0 ? (
            <div className="alert alert-info">
              <i className="fas fa-info-circle me-2"></i>
              Bạn chưa có lịch hẹn nào.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-success">
                  <tr>
                    <th>Ngày hẹn</th>
                    <th>Khung giờ</th>
                    <th>Huấn luyện viên</th>
                    <th>Trạng thái</th>
                    <th>Ghi chú</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingHistory.map((booking) => (
                    <tr key={booking.Id}>
                      <td>{formatDate(booking.SlotDate)}</td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {getSlotLabel(booking.Slot)}
                        </span>
                      </td>
                      <td>{booking.CoachName || 'Chưa có thông tin'}</td>
                      <td>
                        <span className={getStatusBadgeClass(booking.Status)}>
                          {getDisplayStatus(booking.Status)}
                        </span>
                      </td>
                      <td>
                        {booking.Note ? (
                          <span className="text-muted">{booking.Note}</span>
                        ) : (
                          <span className="text-muted fst-italic">Không có ghi chú</span>
                        )}
                      </td>
                      <td>
                        {(booking.Status === 'đang chờ xác nhận' || booking.Status === 'đã xác nhận') && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={async () => {
                              if (window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) {
                                try {
                                  const token = localStorage.getItem('token');
                                  await axios.post(`http://localhost:5000/api/booking/${booking.Id}/cancel-by-member`, {}, {
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  setSuccess('Đã hủy lịch hẹn thành công!');
                                  fetchBookingHistory(); // Refresh danh sách
                                } catch (err) {
                                  console.error('Lỗi khi hủy lịch hẹn:', err);
                                  setError(err.response?.data?.message || 'Không thể hủy lịch hẹn.');
                                }
                              }
                            }}
                          >
                            <i className="fas fa-times me-1"></i>
                            Hủy
                          </button>
                        )}
                        {(booking.Status === 'khách hàng đã hủy' || booking.Status === 'coach đã hủy') && (
                          <span className="text-muted fst-italic">Đã hủy</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage; 