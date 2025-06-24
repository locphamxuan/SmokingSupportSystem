// Trang chat với huấn luyện viên

import React, { useEffect, useState, useRef } from 'react';
import { io } from "socket.io-client";
import { useParams, useNavigate } from 'react-router-dom';
import '../style/ChatCoachPage.scss';

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
  const messageListRef = useRef(null);
  // State để lưu trữ socket
  const [socket, setSocket] = useState(null);

  // Hàm cuộn xuống cuối
  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      query: { token },
      transports: ['websocket'],
    });
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    socket.on("messageHistory", (history) => {
      setMessages(history);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    });
    
    socket.on("newMessage", (message) => {
      setMessages(prev => [...prev, message]);
      setTimeout(scrollToBottom, 100);
    });
    
    socket.on("error", (msg) => setError(msg));

    socket.emit("joinChat", { userId: user.id, coachId: parseInt(coachId) });

    return () => {
      socket.off("messageHistory");
      socket.off("newMessage");
      socket.off("error");
    };
  }, [socket, user, coachId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Hàm gửi tin nhắn
  const sendMessage = () => {
    if (!content.trim() || !socket) return;
    socket.emit("sendMessage", {
      senderId: user.id,
      receiverId: parseInt(coachId),
      content: content.trim(),
    });
    setContent('');
  };

  // Hiển thị giao diện lỗi nếu có lỗi
  if (error) {
    return (
      <div className="container py-4 mt-5">
        <div className="alert alert-danger text-center">{error}</div>
        <div className="text-center">
          <button className="btn btn-outline-primary mt-3" onClick={() => navigate(-1)}>&larr; Quay lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 px-2 mt-5">
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header mb-3 d-flex align-items-center">
          <button className="btn btn-link p-0 me-2" onClick={() => navigate(-1)}>
            <span className="bi bi-arrow-left" style={{ fontSize: 22 }}>&larr;</span>
          </button>
          <div className="avatar bg-primary text-white me-2 d-flex align-items-center justify-content-center" style={{ width: 35, height: 35, borderRadius: '50%' }}>
            {coachInfo?.Name?.charAt(0) || 'H'}
          </div>
          <div>
            <div className="fw-bold text-primary">{coachInfo?.Name || 'Huấn luyện viên'}</div>
            <div className="text-muted small">Huấn luyện viên chuyên nghiệp</div>
          </div>
        </div>
        
        {/* Messages Area */}
        <div className="message-list" ref={messageListRef}>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center text-muted">
                <div className="fw-bold mb-1">Chưa có tin nhắn nào</div>
                <div className="small">Hãy bắt đầu cuộc trò chuyện với huấn luyện viên của bạn!</div>
              </div>
            </div>
          ) : (
            <div>
              {messages.map((message) => (
                <div
                  key={message.Id}
                  className={`message-bubble ${message.SenderId === user.id ? 'right' : 'left'}`}
                >
                  <div>{message.Content}</div>
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    <span className="small fw-semibold opacity-75">
                      {message.SenderId === user.id ? 'Bạn' : message.SenderName}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <form className="input-area mt-auto" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
          <input
            type="text"
            className="form-control me-2"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Nhập tin nhắn của bạn..."
            disabled={sending}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={sending || !content.trim()}
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatCoachPage; 