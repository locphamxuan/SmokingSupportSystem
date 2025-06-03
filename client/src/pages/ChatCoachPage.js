//trang chat với coach

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, Typography, Button, TextField, Box, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ChatCoachPage = () => {
  const { coachId } = useParams();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/messages?user1=${user.id}&user2=${coachId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setMessages(res.data));
  }, [coachId, token, user.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!content.trim()) return;
    await axios.post('http://localhost:5000/api/messages', {
      senderId: user.id,
      receiverId: coachId,
      content
    }, { headers: { Authorization: `Bearer ${token}` } });
    setContent('');
    // Reload messages
    const res = await axios.get(`http://localhost:5000/api/messages?user1=${user.id}&user2=${coachId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMessages(res.data);
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Card sx={{ maxWidth: 500, width: '100%', p: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <IconButton onClick={() => navigate(-1)} color="primary">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ ml: 1, fontWeight: 600 }}>
              Trò chuyện với Coach
            </Typography>
          </Box>
          <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, height: 300, overflowY: 'auto', mb: 2, bgcolor: '#fafafa', p: 1 }}>
            {messages.map(msg => (
              <Box key={msg.Id} sx={{ textAlign: msg.SenderId === user.id ? 'right' : 'left', m: 1 }}>
                <Typography variant="body2" sx={{ display: 'inline-block', bgcolor: msg.SenderId === user.id ? '#1976d2' : '#e0e0e0', color: msg.SenderId === user.id ? 'white' : 'black', px: 2, py: 1, borderRadius: 2, maxWidth: '70%' }}>
                  <b>{msg.SenderId === user.id ? 'Bạn' : 'Coach'}:</b> {msg.Content}
                </Typography>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>
          <Box display="flex" gap={1}>
            <TextField
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Nhập tin nhắn..."
              fullWidth
              size="small"
              onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
            />
            <Button variant="contained" color="primary" onClick={sendMessage} sx={{ fontWeight: 600 }}>
              Gửi
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChatCoachPage; 