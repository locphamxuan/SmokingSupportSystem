import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
} from "@mui/material";
import {
  CheckCircle,
  Warning,
  Favorite,
  MonetizationOn,
  Psychology,
  AccessTime,
} from "@mui/icons-material";
import axios from "axios";

const BlogPage = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get("/api/posts");
        setPosts(response.data);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };

    fetchPosts();
  }, []);

  const benefitsData = [
    {
      icon: <Favorite sx={{ color: '#e91e63' }} />,
      title: "Cải thiện sức khỏe tim mạch",
      description: "Chỉ sau 20 phút ngừng hút thuốc, nhịp tim và huyết áp bắt đầu trở về bình thường"
    },
    {
      icon: <Psychology sx={{ color: '#2196f3' }} />,
      title: "Tăng cường trí nhớ và tập trung",
      description: "Oxy được cung cấp đầy đủ cho não bộ, cải thiện khả năng tư duy và học tập"
    },
    {
      icon: <MonetizationOn sx={{ color: '#4caf50' }} />,
      title: "Tiết kiệm tài chính",
      description: "Tiết kiệm hàng triệu đồng mỗi năm từ việc không mua thuốc lá"
    },
    {
      icon: <AccessTime sx={{ color: '#ff9800' }} />,
      title: "Kéo dài tuổi thọ",
      description: "Giảm nguy cơ ung thư phổi lên đến 50% sau 10 năm cai thuốc"
    }
  ];

  const harmfulEffects = [
    "Ung thư phổi, họng, thực quản và nhiều bộ phận khác",
    "Bệnh tim mạch, đột quỵ và các vấn đề về hệ tuần hoàn",
    "Bệnh phổi tắc nghẽn mãn tính (COPD)",
    "Giảm khả năng sinh sản ở cả nam và nữ",
    "Lão hóa da, răng vàng và hôi miệng",
    "Suy giảm hệ miễn dịch, dễ mắc bệnh",
    "Ảnh hưởng xấu đến thai nhi khi mang thai",
    "Gây nghiện nicotine, khó cai bỏ"
  ];

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      paddingTop: '80px' // Thêm padding-top để tránh navbar che khuất
    }}>
      <Box sx={{ flexGrow: 1 }}>
        <Container maxWidth="lg">
          <Box sx={{ my: 4 }}>
           

            {/* Benefits Section */}
            <Box sx={{ mb: 6 }}>
              <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4, color: '#1976d2' }}>
                Lợi ích của việc cai nghiện thuốc lá
              </Typography>
              <Grid container spacing={3}>
                {benefitsData.map((benefit, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card sx={{ height: '100%', transition: '0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          {benefit.icon}
                          <Typography variant="h6" component="h3" sx={{ ml: 2, fontWeight: 'bold' }}>
                            {benefit.title}
                          </Typography>
                        </Box>
                        <Typography variant="body1" color="text.secondary">
                          {benefit.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Harmful Effects Section */}
            <Box sx={{ mb: 6 }}>
              <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4, color: '#d32f2f' }}>
                Tác hại của thuốc lá
              </Typography>
              <Paper elevation={3} sx={{ p: 4, backgroundColor: '#fff3e0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Warning sx={{ color: '#f57c00', fontSize: 40, mr: 2 }} />
                  <Typography variant="h6" color="#ef6c00" fontWeight="bold">
                    Thuốc lá gây ra nhiều tác hại nghiêm trọng đến sức khỏe:
                  </Typography>
                </Box>
                <List>
                  {harmfulEffects.map((effect, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon>
                        <CheckCircle sx={{ color: '#d32f2f', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={effect}
                        primaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Blog Posts Section */}
            <Typography variant="h4" component="h2" gutterBottom align="center" sx={{ mb: 4, color: '#1976d2' }}>
              Chia sẻ kinh nghiệm cai nghiện thuốc lá
            </Typography>

            <Grid container spacing={4}>
              {posts.map((post) => (
                <Grid item xs={12} md={6} key={post._id}>
                  <Card>
                    {post.image && (
                      <CardMedia
                        component="img"
                        height="200"
                        image={post.image}
                        alt={post.title}
                      />
                    )}
                    <CardContent>
                      <Typography variant="h5" component="h2" gutterBottom>
                        {post.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {post.excerpt}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Posted by: {post.author} -{" "}
                        {new Date(post.createdAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
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

export default BlogPage;
