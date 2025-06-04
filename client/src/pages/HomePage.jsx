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

  const timeline = [
    { time: '20 phút', benefit: 'Nhịp tim và huyết áp trở về bình thường' },
    { time: '12 giờ', benefit: 'Lượng CO trong máu giảm xuống mức bình thường' },
    { time: '2 tuần', benefit: 'Lưu thông máu cải thiện, chức năng phổi tăng 30%' },
    { time: '1 tháng', benefit: 'Ho giảm, thở dễ dàng hơn, năng lượng tăng' },
    { time: '1 năm', benefit: 'Nguy cơ bệnh tim giảm 50%' },
    { time: '5 năm', benefit: 'Nguy cơ đột quỵ giảm như người không hút thuốc' }
  ];

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
      {/* Hero Section - Smoking Cessation Theme */}
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
        {/* Benefits Section */}
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

        {/* Timeline Section */}
        <Box sx={{ my: 8 }}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 6,
              background: 'linear-gradient(145deg, #f0fff4 0%, #c6f6d5 100%)',
              borderRadius: 4,
              border: '2px solid #9ae6b4'
            }}
          >
            <Typography 
              variant="h3" 
              gutterBottom 
              sx={{ 
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#22543d',
                mb: 4
              }}
            >
              ⏰ Timeline phục hồi sức khỏe
            </Typography>
            
            <Grid container spacing={3}>
              {timeline.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box 
                    sx={{ 
                      p: 3,
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      borderRadius: 3,
                      border: '1px solid #9ae6b4',
                      height: '100%'
                    }}
                  >
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: '#38a169',
                        mb: 2
                      }}
                    >
                      {item.time}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: '#22543d',
                        lineHeight: 1.6
                      }}
                    >
                      {item.benefit}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>

        {/* How it works Section */}
        <Box sx={{ my: 8 }}>
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ 
              textAlign: 'center',
              fontWeight: 'bold',
              color: '#2d3748',
              mb: 6
            }}
          >
            🚀 Cách thức hoạt động
          </Typography>
          
          <Grid container spacing={4}>
            {steps.map((step, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      backgroundColor: '#4299e1',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      mx: 'auto',
                      mb: 3,
                      position: 'relative',
                      '&::after': {
                        content: `"${index + 1}"`,
                        position: 'absolute',
                        bottom: -5,
                        right: -5,
                        width: 25,
                        height: 25,
                        borderRadius: '50%',
                        backgroundColor: '#e53e3e',
                        color: 'white',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                      }
                    }}
                  >
                    {step.icon}
                  </Box>
                  <Typography 
                    variant="h5" 
                    gutterBottom 
                    sx={{ fontWeight: 'bold', color: '#2d3748' }}
                  >
                    {step.title}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ color: '#4a5568', lineHeight: 1.6 }}
                  >
                    {step.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Motivation Section */}
        <Box sx={{ my: 8 }}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 6,
              background: 'linear-gradient(145deg, #fef5e7 0%, #fed7aa 100%)',
              borderRadius: 4,
              border: '2px solid #f6ad55',
              textAlign: 'center'
            }}
          >
            <Typography 
              variant="h3" 
              gutterBottom 
              sx={{ 
                fontWeight: 'bold',
                color: '#c05621',
                mb: 3
              }}
            >
              💪 Bạn có thể làm được!
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ 
                color: '#9c4221',
                lineHeight: 1.6,
                mb: 4,
                fontStyle: 'italic'
              }}
            >
              "Cai thuốc lá không phải là từ bỏ một thứ gì đó, mà là lấy lại cuộc sống của chính mình"
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#c05621' }}>
                  85%
                </Typography>
                <Typography variant="body1" sx={{ color: '#9c4221' }}>
                  Tỷ lệ thành công với hỗ trợ
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#c05621' }}>
                  10,000+
                </Typography>
                <Typography variant="body1" sx={{ color: '#9c4221' }}>
                  Người đã cai thành công
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#c05621' }}>
                  24/7
                </Typography>
                <Typography variant="body1" sx={{ color: '#9c4221' }}>
                  Hỗ trợ cộng đồng
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>

      {/* Footer giữ nguyên */}
      <Box 
        component="footer" 
        sx={{ 
          mt: 6, 
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
    </>
  );
};

export default HomePage;
