import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Divider } from '@mui/material';
import axios from 'axios';

const LeaderboardPage = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get('/api/users/leaderboard');
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh'
    }}>
      <Box sx={{ flexGrow: 1 }}>
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Bảng xếp hạng thành viên
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ranking</TableCell>
                <TableCell>Username</TableCell>
                <TableCell align="right">Number of days of quitting smoking</TableCell>
                <TableCell align="right">Score</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={user._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell align="right">{user.daysSmokeFree}</TableCell>
                  <TableCell align="right">{user.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
      </Box>

      {/* Full-width Footer with contact information */}
      <Box 
        component="footer" 
        sx={{ 
          py: 4, 
          backgroundColor: '#1e3a8a', 
          textAlign: 'center',
          width: '100%',
          left: 0,
          right: 0,
          borderTop: '1px solid #2563eb',
          color: 'white',
          boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#60a5fa' }}>
            Nền tảng hỗ trợ cai nghiện thuốc lá
          </Typography>
          
          <Divider sx={{ my: 2, mx: 'auto', width: '50%', borderColor: 'rgba(255,255,255,0.2)' }} />
          
          <Box sx={{ my: 2 }}>
            <Typography variant="body1" gutterBottom sx={{ color: '#e5e7eb' }}>
              <strong style={{ color: '#93c5fd' }}>Hotline:</strong> 1800-8888-77
            </Typography>
            <Typography variant="body1" gutterBottom sx={{ color: '#e5e7eb' }}>
              <strong style={{ color: '#93c5fd' }}>Email:</strong> support@smokingsupport.com
            </Typography>
            <Typography variant="body1" gutterBottom sx={{ color: '#e5e7eb' }}>
              <strong style={{ color: '#93c5fd' }}>Website:</strong> www.smokingsupport.com
            </Typography>
          </Box>
          
          <Typography variant="body2" color="#bfdbfe" sx={{ mt: 2 }}>
            © 2025 Smoking Support Platform. Mọi quyền được bảo lưu.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default LeaderboardPage;