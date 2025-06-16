// Trang chat với huấn luyện viên

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, Typography, Button, TextField, Box, IconButton, CircularProgress, Alert, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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
        console.log("ChatCoachPage - User's Assigned CoachId:", response.data.coachId);

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

  // Hiển thị giao diện lỗi nếu có lỗi
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Card sx={{ maxWidth: 500, width: '100%', p: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <IconButton onClick={() => navigate(-1)} color="primary">
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h5" sx={{ ml: 1, fontWeight: 600 }}>
                Trò chuyện với Huấn luyện viên
              </Typography>
            </Box>
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Card sx={{ maxWidth: 500, width: '100%', p: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <IconButton onClick={() => navigate(-1)} color="primary">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ ml: 1, fontWeight: 600 }}>
              Trò chuyện với Huấn luyện viên
            </Typography>
          </Box>
          
          {/* Hiển thị CircularProgress khi đang tải tin nhắn */}
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height={300}>
              <CircularProgress />
            </Box>
          ) : (
            /* Hộp hiển thị tin nhắn */
            <Box sx={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: 2, 
              height: 300, 
              overflowY: 'auto', 
              mb: 2, 
              bgcolor: '#fafafa', 
              p: 1 
            }}>
              {messages.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <Typography color="textSecondary">
                    Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                  </Typography>
                </Box>
              ) : (
                messages.map((message) => (
                  <Box
                    key={message.Id}
                    sx={{
                      display: 'flex',
                      // Căn chỉnh tin nhắn (của mình sang phải, của người khác sang trái)
                      justifyContent: message.SenderId === user.id ? 'flex-end' : 'flex-start',
                      mb: 2
                    }}
                  >
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        maxWidth: '70%',
                        backgroundColor: message.SenderId === user.id ? 'primary.main' : 'grey.100',
                        color: message.SenderId === user.id ? 'white' : 'text.primary',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="body1" sx={{ mb: 0.5 }}>
                        {message.Content}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {/* Hiển thị tên người gửi */}
                          {message.SenderId === user.id ? 'Bạn' : message.SenderName}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {/* Hiển thị thời gian gửi */}
                          {new Date(message.SentAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                ))
              )}
              {/* Element rỗng để cuộn đến cuối */}
              <div ref={messagesEndRef} />
            </Box>
          )}
          
          {/* Phần nhập tin nhắn và nút gửi */}
          <Box display="flex" gap={1}>
            <TextField
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Nhập tin nhắn..."
              fullWidth
              size="small"
              disabled={sending}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(); }}
            />
            <Button 
              variant="contained" 
              color="primary" 
              onClick={sendMessage} 
              disabled={sending || !content.trim()}
              sx={{ fontWeight: 600 }}
            >
              {sending ? <CircularProgress size={24} color="inherit" /> : 'Gửi'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChatCoachPage; 