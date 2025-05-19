import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const HomePage = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Chào mừng đến với Smoking Support Platform
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, my: 3 }}>
          <Typography variant="h5" gutterBottom>
            Giới thiệu về nền tảng
          </Typography>
          <Typography paragraph>
            Smoking Support Platform là nơi hỗ trợ những người muốn cai thuốc lá một cách hiệu quả. 
            Chúng tôi cung cấp các công cụ, tài nguyên và cộng đồng để giúp bạn vượt qua thử thách này.
          </Typography>
          <Typography paragraph>
            Với sự hỗ trợ của cộng đồng và các chuyên gia, chúng tôi tin rằng bạn có thể 
            đạt được mục tiêu cai thuốc lá của mình.
          </Typography>
        </Paper>

        <Paper elevation={3} sx={{ p: 4, my: 3 }}>
          <Typography variant="h5" gutterBottom>
            Các tính năng chính
          </Typography>
          <Typography component="ul">
            <li>Xem và chia sẻ kinh nghiệm cai thuốc</li>
            <li>Theo dõi tiến trình cai thuốc</li>
            <li>Tham gia cộng đồng hỗ trợ</li>
            <li>Xem bảng xếp hạng thành tích</li>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default HomePage;