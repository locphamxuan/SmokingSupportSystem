import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../style/CoachChatPage.scss';
import facebookImage from "../assets/images/facebook.jpg";
import instagramImage from "../assets/images/instragram.jpg";

const CoachChatPage = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [memberData, setMemberData] = useState(null);
  const messagesEndRef = useRef(null);
  
  let user = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined') {
      user = JSON.parse(userStr);
    }
  } catch (e) {
    console.error("Error parsing user from localStorage:", e);
  }

  const token = localStorage.getItem('token');

  useEffect(() => {
    const checkAccessAndFetchData = async () => {
      try {
        setLoading(true);

        if (!token || !user) {
          navigate('/login');
          return;
        }

        const userProfileRes = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (userProfileRes.data.role !== 'coach') {
          setError('Bạn không có quyền truy cập trang này.');
          setLoading(false);
          return;
        }

        const assignedMembersRes = await axios.get('http://localhost:5000/api/hlv/members', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const assignedMembers = assignedMembersRes.data.members || [];
        const currentMember = assignedMembers.find(member => member.Id === parseInt(memberId));

        if (!currentMember) {
          setError('Bạn không có quyền chat với thành viên này hoặc thành viên không tồn tại.');
          setLoading(false);
          return;
        }
        
        setMemberData(currentMember);
        await fetchMessages();
        setLoading(false);
      } catch (error) {
        console.error('Lỗi kiểm tra quyền truy cập hoặc tải dữ liệu:', error);
        setError(error.response?.data?.message || 'Không thể tải dữ liệu.');
        setLoading(false);
      }
    };

    if (!token) {
      navigate('/login');
      return;
    }
    checkAccessAndFetchData();

    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [memberId, navigate, token]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/messages/member/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && Array.isArray(response.data.messages)) {
        setMessages(response.data.messages);
        setError('');
      } else {
        setError('Định dạng dữ liệu tin nhắn không hợp lệ.');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else {
        setError(error.response?.data?.message || 'Không thể tải tin nhắn. Vui lòng thử lại sau.');
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      await axios.post('http://localhost:5000/api/messages', {
        receiverId: memberId,
        content: newMessage.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewMessage('');
      fetchMessages();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError('');
  };

  const handleBack = () => {
    navigate('/coach/dashboard');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="coach-chat-wrapper">
      <div className="container mt-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button onClick={handleBack} className="btn btn-outline-secondary">
            <i className="fas fa-arrow-left me-2"></i>
            Quay lại lịch tư vấn
          </button>
          <h2 className="section-title mb-0">
            Chat với thành viên: {memberData?.Username || 'Đang tải...'}
          </h2>
          <div style={{ width: '150px' }}></div>
        </div>

        <div className="card chat-card">
          <div className="card-body chat-messages" id="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.Id}
                className={`message-wrapper ${msg.SenderId === parseInt(memberId) ? 'message-received' : 'message-sent'}`}
              >
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-sender">
                      {msg.SenderId === parseInt(memberId) ? msg.SenderName : 'Bạn'}
                    </span>
                  </div>
                  <div className="message-text">
                    {msg.Content}
                  </div>
                  <div className="message-time">
                    {new Date(msg.SentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(msg.SentAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="card-footer chat-input">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Nhập tin nhắn..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
                disabled={sending}
              />
              <button
                className="btn btn-primary"
                onClick={handleSendMessage}
                disabled={sending}
              >
                {sending ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : (
                  <>
                    <i className="fas fa-paper-plane me-2"></i>
                    Gửi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show mt-3" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={handleCloseSnackbar} aria-label="Close"></button>
          </div>
        )}
      </div>

      <footer className="footer">
        <div className="container">
          <div className="social-icons">
            <a
              href="https://www.facebook.com/loccphamxuan?locale=vi_VN"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <img
                src={facebookImage}
                alt="Facebook"
                style={{ width: "36px", height: "36px" }}
              />
            </a>
            <a
              href="https://www.instagram.com/xlocpham/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <img
                src={instagramImage}
                alt="Instagram"
                style={{ width: "36px", height: "36px" }}
              />
            </a>
          </div>
          <p className="copyright">
            &copy; 2024 Hỗ trợ cai nghiện. Đã đăng ký bản quyền.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CoachChatPage; 