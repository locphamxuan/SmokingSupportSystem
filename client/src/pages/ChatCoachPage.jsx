// Trang chat với huấn luyện viên

import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// CSS cho scrollbar
const scrollbarStyles = `
  .chat-messages::-webkit-scrollbar {
    width: 6px;
  }
  .chat-messages::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  .chat-messages::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
  .chat-messages::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
`;

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
  // State để lưu thông tin coach
  const [coachInfo, setCoachInfo] = useState(null);
  // Lấy thông tin người dùng và token từ localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  // Ref để cuộn xuống cuối danh sách tin nhắn
  const messagesEndRef = useRef(null);

  // Hàm tải tin nhắn từ API - sử dụng useCallback để tránh warning
  const fetchMessages = useCallback(async () => {
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
  }, [coachId, token]);

  // useEffect để kiểm tra quyền truy cập và tải tin nhắn ban đầu
  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Gọi API để lấy profile người dùng
        const response = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` } // Gửi token xác thực
        });
        
        // Kiểm tra nếu người dùng không phải là thành viên Premium
        if (!response.data.isMember) {
          setError('Bạn cần là thành viên Premium để sử dụng tính năng này.');
          return;
        }
        
        // Kiểm tra nếu huấn luyện viên được chỉ định không khớp
        if (!response.data.coach || response.data.coach.id !== parseInt(coachId)) {
          setError('Bạn không có quyền chat với huấn luyện viên này.');
          return;
        }
        
        // Lưu thông tin coach
        setCoachInfo(response.data.coach);
        
        // Nếu có quyền truy cập, tải tin nhắn
        fetchMessages();
      } catch (error) {
        console.error('Lỗi kiểm tra quyền truy cập:', error);
        setError('Không thể kiểm tra quyền truy cập. Vui lòng thử lại.');
      }
    };

    checkAccess();
  }, [coachId, token, fetchMessages]);

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

  // Hàm xử lý Enter để gửi tin nhắn
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCloseAlert = () => {
    setError('');
  };

  // Hiển thị giao diện lỗi nếu có lỗi
  if (error) {
    return (
      <div className="container-sm" style={{ marginTop: '120px', paddingTop: '20px' }}>
        <div className="card shadow-lg border-0" style={{ borderRadius: '15px' }}>
          <div className="card-body text-center p-4">
            <div className="d-flex align-items-center justify-content-center mb-3">
              <button 
                onClick={() => navigate(-1)} 
                className="btn btn-primary me-3 rounded-circle"
                style={{ width: '40px', height: '40px' }}
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <h5 className="fw-bold text-primary mb-0">Trò chuyện với Huấn luyện viên</h5>
            </div>
            <div className="alert alert-danger" role="alert">
              {error}
              <button 
                type="button" 
                className="btn-close ms-2" 
                onClick={handleCloseAlert}
                aria-label="Close"
              ></button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="container-sm pb-3" style={{ marginTop: '120px', paddingTop: '20px' }}>
        <div 
          className="card shadow-lg border-0 overflow-hidden"
          style={{ 
            borderRadius: '15px',
            height: 'calc(100vh - 180px)',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          {/* Header */}
          <div 
            className="card-header border-bottom-0"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderBottom: '1px solid rgba(0,0,0,0.1)'
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <button 
                  onClick={() => navigate(-1)} 
                  className="btn btn-primary btn-sm me-2 rounded-circle"
                  style={{ width: '35px', height: '35px' }}
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div 
                  className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2"
                  style={{ width: '35px', height: '35px' }}
                >
                  <i className="fas fa-user-tie"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-0 lh-1">
                    {coachInfo?.username || 'Huấn luyện viên'}
                  </h6>
                  <span 
                    className="badge bg-success text-white"
                    style={{ fontSize: '0.7rem' }}
                  >
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div 
            className="card-body p-0 d-flex flex-column"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              flex: 1,
              minHeight: 0
            }}
          >
            {loading ? (
              <div className="d-flex justify-content-center align-items-center flex-grow-1">
                <div className="spinner-border text-white" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div 
                className="flex-grow-1 p-3 overflow-auto chat-messages"
                style={{ 
                  height: 'calc(100% - 140px)',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255,255,255,0.3) rgba(255,255,255,0.1)',
                  overflowY: 'auto',
                  overflowX: 'hidden'
                }}
              >
                {messages.length === 0 ? (
                  <div className="d-flex justify-content-center align-items-center h-100 flex-column">
                    <div 
                      className="rounded-circle bg-white text-primary d-flex align-items-center justify-content-center mb-3"
                      style={{ width: '50px', height: '50px' }}
                    >
                      <i className="fas fa-user-tie fa-lg"></i>
                    </div>
                    <h6 className="text-white mb-2" style={{ opacity: 0.9 }}>
                      Chưa có tin nhắn nào
                    </h6>
                    <p className="text-white mb-0" style={{ opacity: 0.7 }}>
                      Hãy bắt đầu cuộc trò chuyện!
                    </p>
                  </div>
                ) : (
                  <div>
                    {messages.map((message) => (
                      <div
                        key={message.Id}
                        className={`d-flex mb-3 ${message.SenderId === user.id ? 'justify-content-end' : 'justify-content-start'}`}
                      >
                        <div
                          className={`d-flex align-items-end ${message.SenderId === user.id ? 'flex-row-reverse' : 'flex-row'}`}
                          style={{ maxWidth: '75%' }}
                        >
                          <div 
                            className={`rounded-circle text-white d-flex align-items-center justify-content-center mx-2 ${message.SenderId === user.id ? 'bg-primary' : 'bg-secondary'}`}
                            style={{ width: '28px', height: '28px', minWidth: '28px' }}
                          >
                            <i className={`fas ${message.SenderId === user.id ? 'fa-user' : 'fa-user-tie'} fa-xs`}></i>
                          </div>
                          <div
                            className="card shadow-sm border-0"
                            style={{
                              backgroundColor: message.SenderId === user.id ? '#1976d2' : 'white',
                              color: message.SenderId === user.id ? 'white' : '#333',
                              borderRadius: message.SenderId === user.id ? '15px 15px 5px 15px' : '15px 15px 15px 5px'
                            }}
                          >
                            <div className="card-body p-2">
                              <div className="mb-1" style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>
                                {message.Content}
                              </div>
                              <div 
                                style={{ 
                                  opacity: 0.7,
                                  fontSize: '0.7rem'
                                }}
                              >
                                {new Date(message.SentAt).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div 
            className="card-footer border-top-0 position-relative"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderTop: '1px solid rgba(0,0,0,0.1)',
              flexShrink: 0,
              padding: '15px'
            }}
          >
            <div className="d-flex gap-2 align-items-end">
              <div className="flex-grow-1">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập tin nhắn của bạn..."
                  className="form-control border-1"
                  rows="2"
                  disabled={sending}
                  onKeyPress={handleKeyPress}
                  style={{
                    borderRadius: '20px',
                    border: '1px solid #e0e0e0',
                    resize: 'none',
                    minHeight: '60px',
                    maxHeight: '120px'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1976d2'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>
              <button 
                onClick={sendMessage} 
                disabled={sending || !content.trim()}
                className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '45px', height: '45px', minWidth: '45px' }}
              >
                {sending ? (
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  <i className="fas fa-paper-plane"></i>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 11 }}>
            <div className="toast show" role="alert">
              <div className="toast-header bg-danger text-white">
                <strong className="me-auto">Lỗi</strong>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={handleCloseAlert}
                  aria-label="Close"
                ></button>
              </div>
              <div className="toast-body">
                {error}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatCoachPage; 