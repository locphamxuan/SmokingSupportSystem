import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Paper, Typography, Box, TextField, Button, List, ListItem, ListItemText,
  CircularProgress, Alert, Snackbar
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
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

  const handleBack = () => {
    navigate('/coach/dashboard');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '70vh' }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
          Chat với thành viên: {memberData?.Username || 'Đang tải...'}
        </Typography>
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, border: '1px solid #e0e0e0', borderRadius: 1, mb: 2 }}>
          <List>
            {messages.map((msg) => (
              <ListItem
                key={msg.Id}
                sx={{
                  justifyContent: msg.SenderId === parseInt(memberId) ? 'flex-start' : 'flex-end',
                  pr: msg.SenderId === parseInt(memberId) ? 0 : 2,
                  pl: msg.SenderId === parseInt(memberId) ? 2 : 0,
                }}
              >
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    maxWidth: '70%',
                    bgcolor: msg.SenderId === parseInt(memberId) ? '#e0e0e0' : '#1976d2',
                    color: msg.SenderId === parseInt(memberId) ? 'text.primary' : 'white',
                    borderRadius: '20px',
                    borderBottomLeftRadius: msg.SenderId === parseInt(memberId) ? '0px' : '20px',
                    borderBottomRightRadius: msg.SenderId === parseInt(memberId) ? '20px' : '0px',
                    wordBreak: 'break-word',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {msg.SenderId === parseInt(memberId) ? msg.SenderName : 'Bạn'}
                  </Typography>
                  <Typography variant="body1">
                    {msg.Content}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 0.5, textAlign: 'right', color: msg.SenderId === parseInt(memberId) ? 'text.secondary' : 'rgba(255, 255, 255, 0.7)' }}>
                    {new Date(msg.SentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(msg.SentAt).toLocaleDateString()}
                  </Typography>
                </Paper>
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
          </List>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
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
          <Button
            variant="contained"
            endIcon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={sending}
          >
            Gửi
          </Button>
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