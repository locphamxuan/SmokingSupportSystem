import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Divider, 
  Grid, 
  Card, 
  CardContent,
  Chip
} from '@mui/material';
import {
  SmokeFree as SmokeIcon,
  Favorite as HealthIcon,
  AttachMoney as MoneyIcon,
  Group as CommunityIcon
} from '@mui/icons-material';

const HomePage = () => {
  // Danh sách các lợi ích khi cai thuốc lá
  const benefits = [
    {
      icon: <HealthIcon sx={{ fontSize: 50, color: '#e53e3e' }} />,
      title: 'Cải thiện sức khỏe',
      description: 'Phổi sạch hơn, hô hấp dễ dàng, giảm nguy cơ ung thư và bệnh tim',
      timeframe: 'Sau 20 phút: Nhịp tim và huyết áp giảm'
    },
    {
      icon: <MoneyIcon sx={{ fontSize: 50, color: '#38a169' }} />,
      title: 'Tiết kiệm tiền bạc',
      description: 'Không còn chi tiêu cho thuốc lá, tiết kiệm hàng triệu đồng mỗi năm',
      timeframe: '1 gói/ngày = 2.5 triệu/năm tiết kiệm'
    },
    {
      icon: <SmokeIcon sx={{ fontSize: 50, color: '#3182ce' }} />,
      title: 'Môi trường sạch',
      description: 'Không khói thuốc, không mùi hôi, bảo vệ người thân khỏi khói thụ động',
      timeframe: 'Ngay lập tức: Không còn khói thụ động'
    },
    {
      icon: <CommunityIcon sx={{ fontSize: 50, color: '#805ad5' }} />,
      title: 'Hỗ trợ cộng đồng',
      description: 'Chia sẻ kinh nghiệm, động viên lẫn nhau trong hành trình cai thuốc',
      timeframe: '24/7: Luôn có người đồng hành'
    }
  ];

  // Lịch trình phục hồi sức khỏe sau khi bỏ thuốc
  const timeline = [
    { time: '20 phút', benefit: 'Nhịp tim và huyết áp trở về bình thường' },
    { time: '12 giờ', benefit: 'Lượng CO trong máu giảm xuống mức bình thường' },
    { time: '2 tuần', benefit: 'Lưu thông máu cải thiện, chức năng phổi tăng 30%' },
    { time: '1 tháng', benefit: 'Ho giảm, thở dễ dàng hơn, năng lượng tăng' },
    { time: '1 năm', benefit: 'Nguy cơ bệnh tim giảm 50%' },
    { time: '5 năm', benefit: 'Nguy cơ đột quỵ giảm như người không hút thuốc' }
  ];

  // Các bước để bắt đầu hành trình cai thuốc
  const steps = [
    {
      title: 'Đăng ký tài khoản',
      description: 'Tạo hồ sơ cá nhân và ghi lại thói quen hút thuốc hiện tại',
      icon: '📝'
    },
    {
      title: 'Đặt mục tiêu',
      description: 'Chọn ngày bắt đầu cai thuốc và lập kế hoạch phù hợp',
      icon: '🎯'
    },
    {
      title: 'Theo dõi tiến trình',
      description: 'Ghi lại hành trình hàng ngày, số điếu thuốc giảm dần',
      icon: '📊'
    },
    {
      title: 'Nhận hỗ trợ',
      description: 'Tham gia cộng đồng, nhận tư vấn từ chuyên gia',
      icon: '🤝'
    }
  ];

  return (
    <>
      {/* Phần Hero - Chủ đề Cai Thuốc Lá */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 50%, #718096 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            zIndex: 1
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ mb: 4 }}>
            <SmokeIcon sx={{ fontSize: 80, color: '#68d391', mb: 2 }} />
          </Box>
          
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              mb: 3
            }}
          >
            🚭 Cai Thuốc Lá Thành Công
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 4, 
              opacity: 0.9,
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            Hành trình từ "người hút thuốc" đến "người tự do" - Chúng tôi đồng hành cùng bạn
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Chip 
              label="🌱 Bắt đầu ngay hôm nay"
              sx={{ 
                backgroundColor: '#38a169',
                color: 'white',
                fontSize: '1.1rem',
                py: 3,
                px: 3,
                fontWeight: 'bold'
              }}
            />
            <Chip 
              label="💪 Miễn phí 100%"
              sx={{ 
                backgroundColor: '#3182ce',
                color: 'white',
                fontSize: '1.1rem',
                py: 3,
                px: 3,
                fontWeight: 'bold'
              }}
            />
            <Chip 
              label="⭐ Có lộ trình rõ ràng cho gói premium"
              sx={{ 
                backgroundColor: '#805ad5',
                color: 'white',
                fontSize: '1.1rem',
                py: 3,
                px: 3,
                fontWeight: 'bold'
              }}
            />
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Phần Lợi ích */}
        <Box sx={{ my: 8 }}>
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ 
              textAlign: 'center',
              fontWeight: 'bold',
              color: '#2d3748',
              mb: 2
            }}
          >
            🌟 Lợi ích khi cai thuốc lá
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              textAlign: 'center',
              color: '#718096',
              mb: 6,
              fontStyle: 'italic'
            }}
          >
            Mỗi ngày không hút thuốc là một chiến thắng cho sức khỏe của bạn
          </Typography>
          
          <Grid container spacing={4}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                    },
                    borderRadius: 4,
                    border: '2px solid #e2e8f0',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f7fafc 100%)'
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ mb: 3 }}>
                      {benefit.icon}
                    </Box>
                    <Typography 
                      variant="h5" 
                      gutterBottom 
                      sx={{ fontWeight: 'bold', color: '#2d3748', mb: 2 }}
                    >
                      {benefit.title}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ color: '#4a5568', lineHeight: 1.6, mb: 2 }}
                    >
                      {benefit.description}
                    </Typography>
                    <Chip 
                      label={benefit.timeframe}
                      size="small"
                      sx={{ 
                        backgroundColor: '#edf2f7',
                        color: '#2d3748',
                        fontWeight: 'bold'
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Phần Lịch trình phục hồi */}
        <Box sx={{ my: 8 }}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              borderRadius: 4,
              background: 'linear-gradient(145deg, #ffffff 0%, #f7fafc 100%)',
              border: '2px solid #e2e8f0'
            }}
          >
            <Typography 
              variant="h3" 
              gutterBottom 
              sx={{ 
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#2d3748',
                mb: 4
              }}
            >
              ⏰ Lịch trình phục hồi sức khỏe
            </Typography>
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
              {timeline.map((item, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: '#3182ce',
                        minWidth: 100
                      }}
                    >
                      {item.time}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#4a5568' }}>
                      {item.benefit}
                    </Typography>
                  </Box>
                  {index < timeline.length - 1 && (
                    <Divider sx={{ my: 2 }} />
                  )}
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Phần Các bước bắt đầu */}
        <Box sx={{ my: 8 }}>
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ 
              textAlign: 'center',
              fontWeight: 'bold',
              color: '#2d3748',
              mb: 4
            }}
          >
            🎯 Bắt đầu hành trình cai thuốc
          </Typography>
          <Grid container spacing={4}>
            {steps.map((step, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                    },
                    borderRadius: 4,
                    border: '2px solid #e2e8f0',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f7fafc 100%)'
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography 
                      variant="h1" 
                      sx={{ 
                        fontSize: '3rem',
                        mb: 2
                      }}
                    >
                      {step.icon}
                    </Typography>
                    <Typography 
                      variant="h5" 
                      gutterBottom 
                      sx={{ 
                        fontWeight: 'bold',
                        color: '#2d3748',
                        mb: 2
                      }}
                    >
                      {step.title}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: '#4a5568',
                        lineHeight: 1.6
                      }}
                    >
                      {step.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </>
  );
};

export default HomePage;