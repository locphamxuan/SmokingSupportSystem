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

  // Available time slots as defined in the database
  const availableSlots = [
    { value: '7h-9h', label: '7:00 - 9:00' },
    { value: '10h-12h', label: '10:00 - 12:00' },
    { value: '13h-15h', label: '13:00 - 15:00' },
    { value: '16h-18h', label: '16:00 - 18:00' }
  ];

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
      setTimeout(() => {
        navigate('/my-progress');
      }, 2000);
    } catch (err) {
      console.error('Lỗi khi đặt lịch hẹn:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Không thể đặt lịch hẹn. Vui lòng thử lại.');
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
              onChange={(e) => setSlotDate(e.target.value)}
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
              {availableSlots.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
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
      </div>
    </div>
  );
};

export default BookingPage; 