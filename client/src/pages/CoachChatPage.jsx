import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Paper, Typography, Box, TextField, Button, CircularProgress, Alert, Snackbar, Avatar, IconButton
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const CoachChatPage = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [memberData, setMemberData] = useState(null);
  
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
  const messagesEndRef = useRef(null);

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
    
    if (user) {
      checkAccessAndFetchData();
    }

    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [memberId, navigate, token]);

  const fetchMessages = async () => {
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

  const handleCloseSnackbar = () => {
    setError('');
  };

  const handleBack = () => {
    navigate('/coach/dashboard');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, mt: '80px' }}>
        <Paper elevation={3} sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', maxWidth: '1000px', mx: 'auto' }}>
          <CircularProgress size={40} />
        </Paper>
      </Container>
    );
  }

  if (error && !memberData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, mt: '80px' }}>
        <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
          <Box display="flex" alignItems="center" mb={3}>
            <IconButton onClick={handleBack} color="primary" sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2' }}>
              Chat với thành viên
            </Typography>
          </Box>
          <Alert severity="error">
            {error}
          </Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: 2, mt: '80px' }}>
      <Paper elevation={3} sx={{ height: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: '1000px', mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ 
          p: 2.5, 
          borderBottom: '1px solid #e0e0e0', 
          bgcolor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center'
        }}>
          <IconButton onClick={handleBack} color="primary" sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Avatar sx={{ bgcolor: '#4caf50', mr: 2, width: 35, height: 35 }}>
            {memberData?.Username?.charAt(0)?.toUpperCase() || <PersonIcon />}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', fontSize: '1.1rem' }}>
              {memberData?.Username || 'Thành viên'}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
              Thành viên Premium
            </Typography>
          </Box>
        </Box>

        {/* Messages Area */}
        <Box sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          p: 2,
          bgcolor: '#f5f7fa',
          minHeight: 0
        }}>
          {messages.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <Box textAlign="center">
                <Typography color="textSecondary" variant="h6" sx={{ mb: 1, fontSize: '1rem' }}>
                  Chưa có tin nhắn nào
                </Typography>
                <Typography color="textSecondary" variant="body2" sx={{ fontSize: '0.85rem' }}>
                  Hãy bắt đầu cuộc trò chuyện với thành viên này!
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ maxWidth: '100%' }}>
              {messages.map((msg) => (
                <Box
                  key={msg.Id}
                  sx={{
                    display: 'flex',
                    justifyContent: msg.SenderId === parseInt(memberId) ? 'flex-start' : 'flex-end',
                    mb: 1.5
                  }}
                >
                  <Paper
                    elevation={2}
                    sx={{
                      p: 1.5,
                      maxWidth: '65%',
                      minWidth: '80px',
                      backgroundColor: msg.SenderId === parseInt(memberId) ? '#ffffff' : '#1976d2',
                      color: msg.SenderId === parseInt(memberId) ? 'text.primary' : 'white',
                      borderRadius: 2.5,
                      borderTopLeftRadius: msg.SenderId === parseInt(memberId) ? 4 : 15,
                      borderTopRightRadius: msg.SenderId === parseInt(memberId) ? 15 : 4,
                      borderBottomLeftRadius: 15,
                      borderBottomRightRadius: 15,
                      position: 'relative',
                      wordBreak: 'break-word'
                    }}
                  >
                    <Typography variant="body2" sx={{ mb: 0.5, lineHeight: 1.4, fontSize: '0.9rem' }}>
                      {msg.Content}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          opacity: 0.8,
                          fontWeight: 500,
                          fontSize: '0.65rem'
                        }}
                      >
                        {msg.SenderId === parseInt(memberId) ? msg.SenderName : 'Bạn'}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          opacity: 0.7,
                          fontSize: '0.65rem'
                        }}
                      >
                        {new Date(msg.SentAt).toLocaleDateString('vi-VN')} {new Date(msg.SentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  </Paper>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>
          )}
        </Box>

        {/* Input Area */}
        <Box sx={{ 
          p: 2.5, 
          borderTop: '1px solid #e0e0e0',
          bgcolor: '#ffffff'
        }}>
          <Box display="flex" gap={1.5} alignItems="flex-end">
            <TextField
              fullWidth
              multiline
              maxRows={3}
              size="small"
              variant="outlined"
              placeholder="Nhập tin nhắn của bạn..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  bgcolor: '#f8f9fa',
                  fontSize: '0.9rem'
                }
              }}
            />
            <Button
              variant="contained"
              endIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim()}
              sx={{ 
                fontWeight: 600,
                borderRadius: 2.5,
                px: 2.5,
                py: 1.2,
                minWidth: '80px',
                fontSize: '0.85rem'
              }}
            >
              {sending ? 'Gửi...' : 'Gửi'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      )}
    </Container>
  );
};

export default CoachChatPage; 