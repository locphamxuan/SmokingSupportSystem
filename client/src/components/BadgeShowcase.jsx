import React, { useState, useEffect } from 'react';
import { Grid, Typography, Box, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import Badge from './Badge';

const BadgeShowcase = () => {
  const [allBadges, setAllBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fallback data nếu API không hoạt động
  const fallbackBadges = [
    { Id: 1, Name: '1 ngày không hút thuốc', Description: 'Chúc mừng bạn đã không hút thuốc 1 ngày!', BadgeType: 'loai1', Requirement: '1' },
    { Id: 2, Name: '3 ngày không hút thuốc', Description: 'Tuyệt vời! Bạn đã giữ vững 3 ngày.', BadgeType: 'loai2', Requirement: '3' },
    { Id: 3, Name: '5 ngày không hút thuốc', Description: 'Cố gắng tuyệt vời trong 5 ngày!', BadgeType: 'loai3', Requirement: '5' },
    { Id: 4, Name: '7 ngày không hút thuốc', Description: '1 tuần trôi qua rồi!', BadgeType: 'loai4', Requirement: '7' },
    { Id: 5, Name: '14 ngày không hút thuốc', Description: '2 tuần rồi đó!', BadgeType: 'loai5', Requirement: '14' },
    { Id: 6, Name: '30 ngày không hút thuốc', Description: '1 tháng đầy kiên cường!', BadgeType: 'loai6', Requirement: '30' },
    { Id: 7, Name: '60 ngày không hút thuốc', Description: '2 tháng chinh phục!', BadgeType: 'loai7', Requirement: '60' }
  ];

  useEffect(() => {
    const fetchBadges = async () => {
      const token = localStorage.getItem('token');
      
      try {
        setLoading(true);
        setError(null);

        // Gọi API để lấy tất cả huy hiệu từ database
        const response = await axios.get('http://localhost:5000/api/auth/all-badges', {
          headers: { 
            Authorization: `Bearer ${token}` 
          }
        });

        console.log('Badges from database:', response.data.badges);
        
        if (response.data.badges && response.data.badges.length > 0) {
          setAllBadges(response.data.badges);
        } else {
          // Nếu database trống, sử dụng fallback data
          console.log('Database empty, using fallback data');
          setAllBadges(fallbackBadges);
        }

      } catch (error) {
        console.error('Error fetching badges from database:', error);
        setError('Không thể tải dữ liệu huy hiệu từ database');
        
        // Sử dụng fallback data khi API fail
        setAllBadges(fallbackBadges);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, []);

  if (loading) {
    return (
      <Box sx={{ 
        p: 4, 
        backgroundColor: '#f5f5f5', 
        borderRadius: 2, 
        margin: 2,
        textAlign: 'center',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6">Đang tải huy hiệu từ database...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, backgroundColor: '#f5f5f5', borderRadius: 2, margin: 2 }}>
      <Typography variant="h4" gutterBottom textAlign="center" sx={{ mb: 2 }}>
        🎖️ Tất Cả Huy Hiệu - Từ Database
      </Typography>
      
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error} - Đang hiển thị dữ liệu dự phòng
        </Alert>
      )}
      
      <Typography variant="body1" textAlign="center" sx={{ mb: 4, color: '#666' }}>
        Dữ liệu được lấy từ bảng Badges trong database
      </Typography>
      
      <Grid container spacing={3} justifyContent="center">
        {allBadges.map((badge, index) => (
          <Grid item key={badge.Id} xs={6} sm={4} md={3} lg={2}>
            <Box sx={{ 
              textAlign: 'center', 
              p: 2, 
              backgroundColor: 'white', 
              borderRadius: 2,
              boxShadow: 2,
              transition: 'all 0.3s ease',
              '&:hover': { 
                boxShadow: 4,
                transform: 'translateY(-4px)'
              }
            }}>
              <Badge 
                badgeType={badge.BadgeType}
                name={badge.Name}
                description={badge.Description}
                size={100}
                showAnimation={index % 2 === 0}
              />
              <Typography variant="h6" sx={{ 
                mt: 1, 
                fontSize: '14px',
                fontWeight: 600,
                color: '#333'
              }}>
                {badge.Name}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ 
                fontSize: '12px',
                lineHeight: 1.4,
                mt: 0.5
              }}>
                {badge.Description}
              </Typography>
              <Typography variant="caption" sx={{ 
                display: 'block',
                mt: 1,
                padding: '2px 8px',
                backgroundColor: '#e3f2fd',
                borderRadius: '12px',
                color: '#1976d2',
                fontSize: '10px',
                fontWeight: 500
              }}>
                Yêu cầu: {badge.Requirement} ngày
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
      
      <Typography variant="caption" sx={{ 
        display: 'block',
        textAlign: 'center',
        mt: 3,
        color: '#888',
        fontStyle: 'italic'
      }}>
        📊 Hiển thị {allBadges.length} huy hiệu từ database • {error ? 'Fallback mode' : 'Connected to database'}
      </Typography>
    </Box>
  );
};

export default BadgeShowcase; 