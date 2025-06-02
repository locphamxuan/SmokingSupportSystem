import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';

const CoachChatMembersPage = () => {
  const [members, setMembers] = useState([]);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/messages/members', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setMembers(res.data));
  }, [token]);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
      <Typography variant="h5" fontWeight={600} mb={2}>Thành viên đã nhắn tin</Typography>
      {members.map(member => (
        <Card key={member.Id} sx={{ mb: 2, width: 400 }}>
          <CardContent>
            <Typography variant="h6">{member.Username}</Typography>
            <Typography variant="body2">{member.Email}</Typography>
            <Button variant="contained" sx={{ mt: 1 }} onClick={() => navigate(`/chat-coach/${member.Id}`)}>
              Trả lời chat
            </Button>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default CoachChatMembersPage;
