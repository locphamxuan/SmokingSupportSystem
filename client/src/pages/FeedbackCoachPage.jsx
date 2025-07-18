import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FeedbackCoachPage = () => {
  const [coaches, setCoaches] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    // Lấy danh sách coach đã từng nhận lịch tư vấn
    const fetchCoaches = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/booking/accepted-coaches', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCoaches(res.data.coaches || []);
      } catch (err) {
        setError('Không thể tải danh sách huấn luyện viên.');
      }
    };
    fetchCoaches();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    if (!selectedCoach || !message.trim() || !rating) {
      setError('Vui lòng chọn huấn luyện viên, nhập nội dung và chọn số sao.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/users/feedback', {
        coachId: selectedCoach,
        message,
        rating
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Gửi đánh giá thành công!');
      setMessage('');
      setSelectedCoach('');
      setRating(5);
    } catch (err) {
      setError('Gửi đánh giá thất bại.');
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Gửi đánh giá cho Huấn luyện viên</h2>
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
        <div className="mb-3">
          <label className="form-label">Chọn huấn luyện viên</label>
          <select className="form-select" value={selectedCoach} onChange={e => setSelectedCoach(e.target.value)} required>
            <option value="">-- Chọn huấn luyện viên --</option>
            {coaches.map(coach => (
              <option key={coach.id} value={coach.id}>{coach.username}</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Nội dung đánh giá</label>
          <textarea className="form-control" rows={4} value={message} onChange={e => setMessage(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Đánh giá sao</label>
          <div style={{ fontSize: 32, textAlign: 'center', userSelect: 'none' }}>
            {[1,2,3,4,5].map(star => (
              <span
                key={star}
                style={{
                  cursor: 'pointer',
                  color: (hoverRating || rating) >= star ? '#ffc107' : '#e4e5e9',
                  transition: 'color 0.2s',
                  fontSize: 36,
                  marginRight: 4
                }}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >&#9733;</span>
            ))}
            <span className="ms-2" style={{ fontSize: 20, color: '#1976d2', fontWeight: 500 }}>{rating} sao</span>
          </div>
        </div>
        <button type="submit" className="btn btn-primary">Gửi đánh giá</button>
      </form>
    </div>
  );
};

export default FeedbackCoachPage; 