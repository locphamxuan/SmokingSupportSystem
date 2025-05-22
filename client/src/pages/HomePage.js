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

        <Paper elevation={3} sx={{ p: 4, my: 3 }}>
          <Typography variant="h5" gutterBottom>
            Đăng ký cai nghiện thuốc lá tự nguyện
          </Typography>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Cách thực hiện
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography paragraph sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box component="span" sx={{ fontWeight: 'bold', mr: 1 }}>Bước 1:</Box> 
              Điền đầy đủ thông tin cá nhân
            </Typography>
            <Typography paragraph sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box component="span" sx={{ fontWeight: 'bold', mr: 1 }}>Bước 2:</Box>
              Ghi lại thông số về việc hút thuốc hằng ngày
            </Typography>
            <Typography paragraph sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box component="span" sx={{ fontWeight: 'bold', mr: 1 }}>Bước 3:</Box>
              Hệ thống sẽ ghi nhận hồ sơ của bạn và sẽ phản hồi lại để đưa ra quá trình điều trị phù hợp
            </Typography>
            <Typography paragraph sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box component="span" sx={{ fontWeight: 'bold', mr: 1 }}>Bước 4:</Box>
              Giới thiệu cho bạn biết những trung tâm cai nghiện thuốc lá, các hoạt động xã hội để tránh xa tệ nạn
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default HomePage;