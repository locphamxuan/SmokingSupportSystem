import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import Badge from './Badge';

const BadgeShowcase = () => {
  const allBadges = [
    { type: 'loai1', name: '1 ngày không hút thuốc', description: 'Chúc mừng bạn đã không hút thuốc 1 ngày!' },
    { type: 'loai2', name: '3 ngày không hút thuốc', description: 'Tuyệt vời! Bạn đã giữ vững 3 ngày.' },
    { type: 'loai3', name: '5 ngày không hút thuốc', description: 'Cố gắng tuyệt vời trong 5 ngày!' },
    { type: 'loai4', name: '7 ngày không hút thuốc', description: '1 tuần trôi qua rồi!' },
    { type: 'loai5', name: '14 ngày không hút thuốc', description: '2 tuần rồi đó!' },
    { type: 'loai6', name: '30 ngày không hút thuốc', description: '1 tháng đầy kiên cường!' },
    { type: 'loai7', name: '60 ngày không hút thuốc', description: '2 tháng chinh phục!' }
  ];

  return (
    <Box sx={{ p: 4, backgroundColor: '#f5f5f5', borderRadius: 2, margin: 2 }}>
      <Typography variant="h4" gutterBottom textAlign="center" sx={{ mb: 4 }}>
        🎖️ Badge Showcase - Demo
      </Typography>
      
      <Grid container spacing={3} justifyContent="center">
        {allBadges.map((badge, index) => (
          <Grid item key={badge.type} xs={6} sm={4} md={3} lg={2}>
            <Box sx={{ 
              textAlign: 'center', 
              p: 2, 
              backgroundColor: 'white', 
              borderRadius: 2,
              boxShadow: 2,
              '&:hover': { boxShadow: 4 }
            }}>
              <Badge 
                badgeType={badge.type}
                name={badge.name}
                description={badge.description}
                size={100}
                showAnimation={index % 2 === 0} // Animate every other badge for demo
              />
              <Typography variant="h6" sx={{ mt: 1, fontSize: '14px' }}>
                {badge.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ fontSize: '12px' }}>
                {badge.description}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default BadgeShowcase; 