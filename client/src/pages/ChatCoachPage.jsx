// Trang chat với huấn luyện viên

import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, Typography, Button, TextField, Box, IconButton, CircularProgress, Alert, Paper, Container, Avatar } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';

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
        if (response.data.coachId !== parseInt(coachId)) {
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

  // Hiển thị giao diện lỗi nếu có lỗi
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4, mt: '80px' }}>
        <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
          <Box display="flex" alignItems="center" mb={3}>
            <IconButton onClick={() => navigate(-1)} color="primary" sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2' }}>
              Trò chuyện với Huấn luyện viên
            </Typography>
          </Box>
          <Alert severity="error" sx={{ mt: 2 }}>
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
          <IconButton onClick={() => navigate(-1)} color="primary" sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Avatar sx={{ bgcolor: '#1976d2', mr: 2, width: 35, height: 35 }}>
            {coachInfo?.Name?.charAt(0) || 'H'}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2', fontSize: '1.1rem' }}>
              {coachInfo?.Name || 'Huấn luyện viên'}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
              Huấn luyện viên chuyên nghiệp
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
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress size={35} />
            </Box>
          ) : messages.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <Box textAlign="center">
                <Typography color="textSecondary" variant="h6" sx={{ mb: 1, fontSize: '1rem' }}>
                  Chưa có tin nhắn nào
                </Typography>
                <Typography color="textSecondary" variant="body2" sx={{ fontSize: '0.85rem' }}>
                  Hãy bắt đầu cuộc trò chuyện với huấn luyện viên của bạn!
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ maxWidth: '100%' }}>
              {messages.map((message) => (
                <Box
                  key={message.Id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.SenderId === user.id ? 'flex-end' : 'flex-start',
                    mb: 1.5
                  }}
                >
                  <Paper
                    elevation={2}
                    sx={{
                      p: 1.5,
                      maxWidth: '65%',
                      minWidth: '80px',
                      backgroundColor: message.SenderId === user.id ? '#1976d2' : '#ffffff',
                      color: message.SenderId === user.id ? 'white' : 'text.primary',
                      borderRadius: 2.5,
                      borderTopLeftRadius: message.SenderId === user.id ? 15 : 4,
                      borderTopRightRadius: message.SenderId === user.id ? 4 : 15,
                      borderBottomLeftRadius: 15,
                      borderBottomRightRadius: 15,
                      position: 'relative',
                      wordBreak: 'break-word'
                    }}
                  >
                    <Typography variant="body2" sx={{ mb: 0.5, lineHeight: 1.4, fontSize: '0.9rem' }}>
                      {message.Content}
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
                        {message.SenderId === user.id ? 'Bạn' : message.SenderName}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          opacity: 0.7,
                          fontSize: '0.65rem'
                        }}
                      >
                        {new Date(message.SentAt).toLocaleDateString('vi-VN')} {new Date(message.SentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
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
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Nhập tin nhắn của bạn..."
              multiline
              maxRows={3}
              fullWidth
              size="small"
              variant="outlined"
              disabled={sending}
              onKeyDown={e => { 
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
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
              color="primary" 
              onClick={sendMessage} 
              disabled={sending || !content.trim()}
              endIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
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
    </Container>
  );
};

export default ChatCoachPage; 