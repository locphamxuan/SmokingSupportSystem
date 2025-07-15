import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CoachChatListPage = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        // Ưu tiên lấy từ API conversations nếu có, nếu không thì lấy từ booking
        const res = await axios.get('http://localhost:5000/api/messages/coach/conversations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMembers(res.data.conversations || []);
      } catch (err) {
        setError('Không thể tải danh sách thành viên đã nhắn tin.');
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  if (loading) return <div className="container py-5 text-center">Đang tải danh sách...</div>;
  if (error) return <div className="container py-5 text-center text-danger">{error}</div>;

  return (
    <div className="container py-4 mt-5">
      <h3 className="mb-4">Chọn thành viên để chat</h3>
      {members.length === 0 ? (
        <div className="alert alert-info">Bạn chưa có thành viên nào đã nhắn tin.</div>
      ) : (
        <ul className="list-group">
          {members.map(member => (
            <li key={member.memberId} className="list-group-item d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                {member.memberAvatar ? (
                  <img src={member.memberAvatar} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 12 }} />
                ) : (
                  <i className="bi bi-person-circle" style={{ fontSize: 36, marginRight: 12 }}></i>
                )}
                <span className="fw-bold">{member.memberName || member.username || `Thành viên #${member.memberId}`}</span>
              </div>
              <button className="btn btn-primary" onClick={() => navigate(`/coach/chat/${member.memberId}`)}>
                Chat
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CoachChatListPage; 