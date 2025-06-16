import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../style/BookingPage.scss'; // Assuming you'll create this file for custom styles
import 'bootstrap/dist/css/bootstrap.min.css';

const BookingPage = () => {
  const navigate = useNavigate();
  const [scheduledTime, setScheduledTime] = useState('');
  const [note, setNote] = useState('');
  const [coaches, setCoaches] = useState([]);
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await axios.get('http://localhost:5000/api/auth/coaches', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCoaches(response.data.coaches);
        if (response.data.coaches.length > 0) {
          setSelectedCoachId(response.data.coaches[0].Id); // Select the first coach by default
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách huấn luyện viên:', err);
        setError(err.response?.data?.message || 'Không thể tải danh sách huấn luyện viên.');
      } finally {
        setLoading(false);
      }
    };

    fetchCoaches();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      if (!selectedCoachId) {
        setError('Vui lòng chọn một huấn luyện viên.');
        return;
      }
      await axios.post('http://localhost:5000/api/booking/book-appointment', {
        coachId: parseInt(selectedCoachId),
        scheduledTime,
        note
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Lịch hẹn của bạn đã được gửi thành công!');
      setTimeout(() => {
        navigate('/my-progress');
      }, 2000);
    } catch (err) {
      console.error('Lỗi khi đặt lịch hẹn:', err);
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
            <label htmlFor="coachSelect" className="form-label">Chọn Huấn luyện viên</label>
            <select
              className="form-select"
              id="coachSelect"
              value={selectedCoachId}
              onChange={(e) => setSelectedCoachId(e.target.value)}
              required
            >
              {coaches.map((coach) => (
                <option key={coach.Id} value={coach.Id}>
                  {coach.Username}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="scheduledTime" className="form-label">Thời gian hẹn</label>
            <input
              type="datetime-local"
              className="form-control"
              id="scheduledTime"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              required
            />
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