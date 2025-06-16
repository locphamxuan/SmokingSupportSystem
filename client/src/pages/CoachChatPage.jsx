import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const CoachChatPage = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [memberData, setMemberData] = useState(null);
  const [user, setUser] = useState(null);
  
  const token = localStorage.getItem('token');
  const messagesEndRef = useRef(null);

  // Initialize user state
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined') {
        setUser(JSON.parse(userStr));
      }
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
    }
  }, []);

  // Use useCallback to wrap fetchMessages to avoid dependency issues
  const fetchMessages = useCallback(async () => {
    try {
      console.log('Fetching messages for member:', memberId);
      const response = await axios.get(`http://localhost:5000/api/messages/member/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Messages response:', response.data);
      if (response.data && Array.isArray(response.data.messages)) {
        setMessages(response.data.messages);
        setError('');
      } else {
        console.error('Invalid messages data format:', response.data);
        setError('Định dạng dữ liệu tin nhắn không hợp lệ.');
      }
    } catch (error) {
      console.error('Chi tiết lỗi khi tải tin nhắn:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      if (error.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else {
        setError(error.response?.data?.message || 'Không thể tải tin nhắn. Vui lòng thử lại sau.');
      }
    }
  }, [memberId, token, navigate]);

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
        console.log('User Profile Role:', userProfileRes.data.role);

        if (userProfileRes.data.role !== 'coach') {
          setError('Bạn không có quyền truy cập trang này.');
          setLoading(false);
          return;
        }

        const assignedMembersRes = await axios.get('http://localhost:5000/api/hlv/members', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const assignedMembers = assignedMembersRes.data.members || [];
        console.log('Assigned Members:', assignedMembers);
        const currentMember = assignedMembers.find(member => member.Id === parseInt(memberId));
        console.log('Current Member Found:', currentMember);

        if (!currentMember) {
          setError('Bạn không có quyền chat với thành viên này hoặc thành viên không tồn tại.');
          setLoading(false);
          return;
        }
        
        setMemberData(currentMember);
        console.log('memberData set to:', currentMember);
        
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
    
    if (user) {
      checkAccessAndFetchData();

      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [memberId, navigate, token, fetchMessages, user]);

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
      console.error('Lỗi khi gửi tin nhắn:', err);
      setError(err.response?.data?.message || 'Không thể gửi tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  // Hàm xử lý Enter để gửi tin nhắn
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCloseAlert = () => {
    setError('');
  };

  if (loading) {
    return (
      <div className="container-sm" style={{ marginTop: '120px', paddingTop: '20px' }}>
        <div className="card shadow-lg border-0" style={{ borderRadius: '15px' }}>
          <div className="card-body text-center p-4">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <h6 className="mt-3 text-muted">Đang tải dữ liệu...</h6>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-sm" style={{ marginTop: '120px', paddingTop: '20px' }}>
        <div className="card shadow-lg border-0" style={{ borderRadius: '15px' }}>
          <div className="card-body text-center p-4">
            <div className="d-flex align-items-center justify-content-center mb-3">
              <button 
                onClick={() => navigate('/coach/dashboard')} 
                className="btn btn-success me-3 rounded-circle"
                style={{ width: '40px', height: '40px' }}
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <h5 className="fw-bold text-success mb-0">Chat với thành viên</h5>
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
            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
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
                  onClick={() => navigate('/coach/dashboard')} 
                  className="btn btn-success btn-sm me-2 rounded-circle"
                  style={{ width: '35px', height: '35px' }}
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
              <div 
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                style={{ width: '35px', height: '35px' }}
              >
                <i className="fas fa-user"></i>
              </div>
              <div>
                <h6 className="fw-bold mb-0 lh-1">
                  {memberData?.Username || 'Thành viên'}
                </h6>
                <span 
                  className="badge bg-success text-white"
                  style={{ fontSize: '0.7rem' }}
                >
                  Thành viên Premium
                </span>
              </div>
            </div>
            <span className="badge bg-warning text-white fw-bold">
              <i className="fas fa-user-tie me-1"></i>
              Huấn luyện viên
            </span>
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
                  className="rounded-circle bg-white text-success d-flex align-items-center justify-content-center mb-3"
                  style={{ width: '50px', height: '50px' }}
                >
                  <i className="fas fa-user fa-lg"></i>
                </div>
                <h6 className="text-white mb-2" style={{ opacity: 0.9 }}>
                  Chưa có tin nhắn nào
                </h6>
                <p className="text-white mb-0" style={{ opacity: 0.7 }}>
                  Hãy bắt đầu cuộc trò chuyện để hỗ trợ!
                </p>
              </div>
            ) : (
              <div>
                {messages.map((msg) => (
                  <div
                    key={msg.Id}
                    className={`d-flex mb-3 ${msg.SenderId === parseInt(memberId) ? 'justify-content-start' : 'justify-content-end'}`}
                  >
                    <div
                      className={`d-flex align-items-end ${msg.SenderId === parseInt(memberId) ? 'flex-row' : 'flex-row-reverse'}`}
                      style={{ maxWidth: '75%' }}
                    >
                      <div 
                        className={`rounded-circle text-white d-flex align-items-center justify-content-center mx-2 ${msg.SenderId === parseInt(memberId) ? 'bg-primary' : 'bg-success'}`}
                        style={{ width: '28px', height: '28px', minWidth: '28px' }}
                      >
                        <i className={`fas ${msg.SenderId === parseInt(memberId) ? 'fa-user' : 'fa-user-tie'} fa-xs`}></i>
                      </div>
                      <div
                        className="card shadow-sm border-0"
                        style={{
                          backgroundColor: msg.SenderId === parseInt(memberId) ? 'white' : '#4CAF50',
                          color: msg.SenderId === parseInt(memberId) ? '#333' : 'white',
                          borderRadius: msg.SenderId === parseInt(memberId) ? '15px 15px 15px 5px' : '15px 15px 5px 15px'
                        }}
                      >
                        <div className="card-body p-2">
                          <div className="fw-bold mb-1" style={{ fontSize: '0.75rem' }}>
                            {msg.SenderId === parseInt(memberId) ? msg.SenderName : 'Bạn (HLV)'}
                          </div>
                          <div className="mb-1" style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>
                            {msg.Content}
                          </div>
                          <div 
                            style={{ 
                              opacity: 0.7,
                              fontSize: '0.7rem'
                            }}
                          >
                            {new Date(msg.SentAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })} - {new Date(msg.SentAt).toLocaleDateString()}
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
                 value={newMessage}
                 onChange={(e) => setNewMessage(e.target.value)}
                 placeholder="Nhập tin nhắn hỗ trợ cho thành viên..."
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
                 onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
                 onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
               />
             </div>
             <button 
               onClick={handleSendMessage} 
               disabled={sending || !newMessage.trim()}
               className="btn btn-success rounded-circle d-flex align-items-center justify-content-center"
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

export default CoachChatPage; 