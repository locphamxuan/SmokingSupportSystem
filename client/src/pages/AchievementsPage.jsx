import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Grid, Card, CardContent, CardActions, Button } from '@mui/material';
import axios from 'axios';

const AchievementsPage = () => {
  const [achievements, setAchievements] = useState([]);
  useEffect(() => {
    const fetchAchievements = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      // Giả sử achievements nằm trong profile, hoặc bạn có API riêng
      const res = await axios.get('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAchievements(res.data.achievements || []);
    };
    fetchAchievements();
  }, []);
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1976d2', mt: 4 }}>
        Thành tích của bạn
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          {achievements.length === 0 && (
            <Typography>Chưa có thành tích nào.</Typography>
          )}
          {achievements.map((achievement, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{achievement.title}</Typography>
                  <Typography color="textSecondary">
                    {achievement.description}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Đạt được: {new Date(achievement.date).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small">Chia sẻ</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
};

export default AchievementsPage;