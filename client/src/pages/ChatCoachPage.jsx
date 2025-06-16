// Trang chat với huấn luyện viên

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../style/ChatCoachPage.scss';
import facebookImage from '../assets/images/facebook.jpg';
import instagramImage from '../assets/images/instragram.jpg';

const ChatCoachPage = () => {
  // Lấy coachId từ URL params
  const { coachId } = useParams();
  // State để lưu trữ danh sách tin nhắn
  const [messages, setMessages] = useState([]);
  // State để lưu trữ nội dung tin nhắn mới
  const [content, setContent] = useState('');
  // State quản lý trạng thái tải tin nhắn
  const [loading, setLoading] = useState(true);
  // State để lưu trữ thông báo lỗi
  const [error, setError] = useState('');
  // State quản lý trạng thái gửi tin nhắn
  const [sending, setSending] = useState(false);
  // Lấy thông tin người dùng và token từ localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  // Ref để cuộn xuống cuối danh sách tin nhắn
  const messagesEndRef = useRef(null);

  // useEffect để kiểm tra quyền truy cập và tải tin nhắn ban đầu
  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Gọi API để lấy profile người dùng
        const response = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` } // Gửi token xác thực
        });
        
        console.log("ChatCoachPage - User Profile Response:", response.data);
        console.log("ChatCoachPage - Current User ID:", user.id);
        console.log("ChatCoachPage - Coach ID from URL params:", coachId);
        console.log("ChatCoachPage - User's Assigned CoachId:", response.data.coach?.Id);

        // Kiểm tra nếu người dùng không phải là thành viên Premium
        if (!response.data.isMember) {
          setError('Bạn cần là thành viên Premium để sử dụng tính năng này.');
          return;
        }
        
        // Kiểm tra nếu huấn luyện viên được chỉ định không khớp
        if (!response.data.coach || response.data.coach.Id !== parseInt(coachId)) {
          setError('Bạn không có quyền chat với huấn luyện viên này.');
          return;
        }
        
        // Nếu có quyền truy cập, tải tin nhắn
        fetchMessages();
      } catch (error) {
        console.error('Lỗi kiểm tra quyền truy cập:', error);
        setError('Không thể kiểm tra quyền truy cập. Vui lòng thử lại.');
      }
    };

    checkAccess();
  }, [coachId, token]);

  // Hàm tải tin nhắn từ API
  const fetchMessages = async () => {
    try {
      setLoading(true);
      // Gửi yêu cầu API để lấy tin nhắn với huấn luyện viên cụ thể
      const response = await axios.get(`http://localhost:5000/api/messages/${coachId}`, {
        headers: { Authorization: `Bearer ${token}` } // Gửi token xác thực
      });
      setMessages(response.data.messages || []); // Cập nhật danh sách tin nhắn
      setError(''); // Xóa lỗi nếu có
    } catch (error) {
      console.error('Lỗi khi tải tin nhắn:', error);
      setError('Không thể tải tin nhắn.');
    } finally {
      setLoading(false); // Dừng trạng thái tải
    }
  };

  // useEffect để cuộn xuống cuối danh sách tin nhắn khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Hàm gửi tin nhắn
  const sendMessage = async () => {
    if (!content.trim()) return; // Không gửi tin nhắn rỗng
    
    try {
      setSending(true); // Đặt trạng thái đang gửi
      // Gửi yêu cầu API để gửi tin nhắn
      await axios.post('http://localhost:5000/api/messages', {
        receiverId: coachId,
        content: content.trim() // Xóa khoảng trắng thừa
      }, { 
        headers: { Authorization: `Bearer ${token}` } // Gửi token xác thực
      });
      
      setContent(''); // Xóa nội dung tin nhắn sau khi gửi
      await fetchMessages(); // Tải lại tin nhắn để hiển thị tin nhắn mới
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      setError('Không thể gửi tin nhắn.');
    } finally {
      setSending(false); // Dừng trạng thái gửi
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Hiển thị giao diện lỗi nếu có lỗi
  if (error) {
    return (
      <div className="chat-coach-wrapper">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="chat-card">
                <div className="chat-header">
                  <button className="back-button btn btn-link" onClick={() => navigate(-1)}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>Quay lại</span>
                  </button>
                  <h5 className="mb-0">Trò chuyện với Huấn luyện viên</h5>
                </div>
                <div className="alert alert-danger m-3" role="alert">
                  {error}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-coach-wrapper">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="chat-card">
              <div className="chat-header">
                <button className="back-button btn btn-link" onClick={() => navigate(-1)}>
                  <FontAwesomeIcon icon={faArrowLeft} />
                  <span>Quay lại</span>
                </button>
                <h5 className="mb-0">Trò chuyện với Huấn luyện viên</h5>
              </div>
              
              {/* Hiển thị CircularProgress khi đang tải tin nhắn */}
              {loading ? (
                <div className="loading-spinner">
                  <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                </div>
              ) : (
                /* Hộp hiển thị tin nhắn */
                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.Id}
                        className={`message ${message.SenderId === user.id ? 'sent' : 'received'}`}
                      >
                        <div className="message-content">
                          {message.Content}
                        </div>
                        <div className="message-info">
                          <span>{message.SenderId === user.id ? 'Bạn' : message.SenderName}</span>
                          <span>{new Date(message.SentAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                  {/* Element rỗng để cuộn đến cuối */}
                  <div ref={messagesEndRef} />
                </div>
              )}
              
              {/* Phần nhập tin nhắn và nút gửi */}
              <div className="chat-input">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập tin nhắn..."
                    disabled={sending}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={sendMessage}
                    disabled={sending || !content.trim()}
                  >
                    {sending ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <FontAwesomeIcon icon={faPaperPlane} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="footer bg-light text-dark py-4">
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

export default ChatCoachPage; 