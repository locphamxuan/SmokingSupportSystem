import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CoachFeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/coach/feedback', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFeedbacks(res.data.feedbacks || []);
      } catch (err) {
        setError('Không thể tải feedback.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, []);

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">Đánh giá từ khách hàng</h2>
      {loading && <div>Đang tải...</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && feedbacks.length === 0 && <div className="text-center">Chưa có đánh giá nào.</div>}
      {!loading && feedbacks.length > 0 && (
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Tên khách hàng</th>
                <th>Số sao</th>
                <th>Nội dung</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((fb, idx) => (
                <tr key={fb.FeedbackId}>
                  <td>{idx + 1}</td>
                  <td>{fb.CustomerName}</td>
                  <td>{fb.Rating} <span style={{color:'#ffc107'}}>&#9733;</span></td>
                  <td>{fb.Messages}</td>
                  <td>{fb.SentAt ? fb.SentAt.slice(0, 16).replace('T', ' ') : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CoachFeedbackPage; 