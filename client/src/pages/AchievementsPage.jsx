import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Grid, Card, CardContent, CardActions, Button, Box, Chip } from '@mui/material';
import axios from 'axios';
import Badge from '../components/Badge';
import '../style/AchievementsPage.scss';
import Badge1Day from '../assets/badges/huyhiệu1ngày.jpg';
import Badge3Days from '../assets/badges/huyhiệu3ngày.jpg';
import Badge5Days from '../assets/badges/huyhiệu5ngày.jpg';
import Badge7Days from '../assets/badges/huyhiệu7ngày.jpg';
import Badge14Days from '../assets/badges/huyhiệu14ngày.jpg';
import Badge30Days from '../assets/badges/huyhiệu30ngày.jpg';
import Badge60Days from '../assets/badges/huyhiệu60ngày.jpg';

const badges = [
    { id: 1, name: "1 Ngày Không Hút Thuốc", description: "Bạn đã vượt qua ngày đầu tiên không hút thuốc!", image: Badge1Day, daysRequired: 1 },
    { id: 2, name: "3 Ngày Kiên Trì", description: "Ba ngày liên tiếp không hút thuốc - một thành tích đáng nể!", image: Badge3Days, daysRequired: 3 },
    { id: 3, name: "5 Ngày Mạnh Mẽ", description: "Năm ngày không hút thuốc - bạn đang làm rất tốt!", image: Badge5Days, daysRequired: 5 },
    { id: 4, name: "1 Tuần Thành Công", description: "Một tuần không hút thuốc - một cột mốc quan trọng!", image: Badge7Days, daysRequired: 7 },
    { id: 5, name: "2 Tuần Kiên Định", description: "Hai tuần không hút thuốc - bạn đang thay đổi thói quen!", image: Badge14Days, daysRequired: 14 },
    { id: 6, name: "1 Tháng Phi Thường", description: "Một tháng không hút thuốc - thành tích xuất sắc!", image: Badge30Days, daysRequired: 30 },
    { id: 7, name: "2 Tháng Chiến Thắng", description: "Hai tháng không hút thuốc - bạn đã thực sự thay đổi!", image: Badge60Days, daysRequired: 60 }
];

const AchievementsPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quitPlan, setQuitPlan] = useState(null);
  const [smokeFreeStreak, setSmokeFreeStreak] = useState(0);

  useEffect(() => {
    const fetchAchievements = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch user badges
        try {
          const badgesRes = await axios.get('http://localhost:5000/api/auth/badges', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserBadges(badgesRes.data.badges || []);
          console.log('User badges:', badgesRes.data.badges);
        } catch (badgeError) {
          console.log('Error fetching user badges:', badgeError);
          setUserBadges([]);
        }
        
        // Try to fetch all available badges from database, fallback to static
        try {
          const allBadgesRes = await axios.get('http://localhost:5000/api/auth/all-badges', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setAllBadges(allBadgesRes.data.badges || badges);
          console.log('All badges from API:', allBadgesRes.data.badges);
        } catch (allBadgesError) {
          console.log('API all-badges not available, using static data');
          setAllBadges(badges);
        }
        
        // Legacy achievements for compatibility
        try {
          const res = await axios.get('http://localhost:5000/api/auth/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setAchievements(res.data.achievements || []);
        } catch (profileError) {
          console.log('Error fetching profile:', profileError);
          setAchievements([]);
        }
        
      } catch (error) {
        console.error('Error fetching achievements:', error);
        // Use static badges as fallback
        setAllBadges(badges);
        setUserBadges([]);
        setAchievements([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  // Debug logs
  console.log('All badges:', allBadges);
  console.log('User badges:', userBadges);
  console.log('Loading:', loading);
  const isUserBadge = (badgeId) => {
    // Database returns badge objects with Id field (not BadgeId)
    return userBadges.some(userBadge => userBadge.Id === badgeId);
  };

  const getUserBadgeInfo = (badgeId) => {
    // Database returns badge objects with Id field (not BadgeId)
    return userBadges.find(userBadge => userBadge.Id === badgeId);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <Typography>Đang tải thành tích...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" className="achievements-page" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          🏆 Thành Tích Cai Thuốc Của Bạn 🏆
        </Typography>
        
        <Typography variant="h6" sx={{ color: '#666', mb: 3 }}>
          Theo dõi hành trình cai thuốc và các mốc quan trọng của bạn
        </Typography>
        
        {/* Statistics */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`${userBadges.length}/${allBadges.length} Huy hiệu đã đạt được`}
            color={userBadges.length > 0 ? "primary" : "default"}
            sx={{ fontSize: '16px', px: 2, py: 1, height: 'auto' }}
          />
          {userBadges.length > 0 && (
            <Chip 
              label={`Mới nhất: ${getUserBadgeInfo(Math.max(...userBadges.map(b => b.Id)))?.AwardedAt ? new Date(getUserBadgeInfo(Math.max(...userBadges.map(b => b.Id))).AwardedAt).toLocaleDateString() : ''}`}
              color="success"
              sx={{ fontSize: '14px', px: 2, py: 1, height: 'auto' }}
            />
          )}
        </Box>
        
        {userBadges.length === 0 && (
          <Paper sx={{ 
            mt: 3, 
            p: 3,
            backgroundColor: '#f8f9ff',
            border: '2px dashed #e0e7ff',
            borderRadius: 3
          }}>
            <Typography variant="h6" sx={{ 
              color: '#6366f1', 
              fontWeight: 600,
              mb: 1
            }}>
              🎯 Hãy bắt đầu hành trình của bạn!
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b' }}>
              Bạn chưa đạt được huy hiệu nào. Hãy cố gắng để nhận huy hiệu đầu tiên!
            </Typography>
          </Paper>
        )}
      </Box>

      {/* User's Achieved Badges */}
      {userBadges.length > 0 && (
        <Paper sx={{ 
          p: 4, 
          mb: 6, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 4,
          boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)'
        }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            color: 'white', 
            mb: 4, 
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            ✨ Huy Hiệu Của Bạn ✨
          </Typography>
          
          <Box sx={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            justifyContent: 'center',
            alignItems: 'stretch'
          }}>
            {allBadges.filter(badge => isUserBadge(badge.Id)).map((badge) => {
              const userBadgeInfo = getUserBadgeInfo(badge.Id);
              
              return (
                <Card 
                  key={badge.Id} 
                  className="shimmer-card"
                  sx={{ 
                    width: { xs: '160px', sm: '180px', md: '200px' },
                    minHeight: '280px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
                    color: 'white',
                    border: '3px solid #FFD700',
                    borderRadius: 3,
                    boxShadow: '0 12px 25px rgba(255, 215, 0, 0.4)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: '0 20px 40px rgba(255, 215, 0, 0.5)',
                    }
                  }}>
                  <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ mb: 2, position: 'relative', zIndex: 1 }}>
                      <Badge 
                        badgeType={badge.BadgeType}
                        size={90}
                        showAnimation={true}
                      />
                    </Box>
                    
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700, 
                      fontSize: '16px',
                      mb: 1.5,
                      color: 'white',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      lineHeight: 1.2,
                      flexGrow: 1
                    }}>
                      {badge.Name}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ 
                      fontSize: '13px',
                      mb: 2,
                      color: 'rgba(255,255,255,0.95)',
                      lineHeight: 1.3,
                      flexGrow: 1
                    }}>
                      {badge.Description}
                    </Typography>

                    <Box sx={{ mt: 'auto' }}>
                      <Chip 
                        label="🏆 Đã đạt"
                        size="small"
                        sx={{ 
                          fontSize: '11px',
                          height: '24px',
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          fontWeight: 700,
                          mb: 1,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      />
                      
                      {userBadgeInfo && (
                        <Typography variant="caption" sx={{ 
                          display: 'block', 
                          fontSize: '11px',
                          color: 'rgba(255,255,255,0.9)',
                          fontWeight: 500
                        }}>
                          📅 {new Date(userBadgeInfo.AwardedAt).toLocaleDateString('vi-VN')}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Paper>
      )}

      {/* All Badges Grid */}
      <Paper sx={{ 
        p: 4, 
        mb: 4, 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: 4,
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
      }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 700, 
          color: '#334155', 
          mb: 4, 
          textAlign: 'center'
        }}>
          🎖️ Tất Cả Huy Hiệu
        </Typography>
        
        {allBadges.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: '18px', color: '#64748b' }}>
              🔄 Đang tải danh sách huy hiệu...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            justifyContent: 'center',
            alignItems: 'stretch'
          }}>
            {allBadges.map((badge) => {
              const hasEarned = isUserBadge(badge.Id);
              const userBadgeInfo = getUserBadgeInfo(badge.Id);
              
              return (
                <Card key={badge.Id} sx={{ 
                  width: { xs: '160px', sm: '180px', md: '200px' },
                  minHeight: '280px',
                  textAlign: 'center',
                  background: hasEarned 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
                  color: hasEarned ? 'white' : '#475569',
                  border: hasEarned ? '3px solid #667eea' : '2px solid #e2e8f0',
                  borderRadius: 3,
                  boxShadow: hasEarned 
                    ? '0 10px 25px rgba(102, 126, 234, 0.3)' 
                    : '0 4px 15px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: hasEarned 
                      ? '0 15px 35px rgba(102, 126, 234, 0.4)' 
                      : '0 8px 25px rgba(0,0,0,0.12)'
                  }
                }}>
                  <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ position: 'relative', mb: 2 }}>
                      <Badge 
                        badgeType={badge.BadgeType}
                        size={90}
                        showAnimation={hasEarned}
                      />
                      {!hasEarned && (
                        <Box sx={{
                          position: 'absolute',
                          top: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '90px',
                          height: '90px',
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '24px'
                        }}>
                          🔒
                        </Box>
                      )}
                    </Box>
                    
                    <Typography variant="h6" sx={{ 
                      fontWeight: 600, 
                      fontSize: '16px',
                      mb: 1.5,
                      color: hasEarned ? 'white' : '#334155',
                      lineHeight: 1.2,
                      flexGrow: 1
                    }}>
                      {badge.Name}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ 
                      fontSize: '13px',
                      mb: 2,
                      color: hasEarned ? 'rgba(255,255,255,0.9)' : '#64748b',
                      lineHeight: 1.3,
                      flexGrow: 1
                    }}>
                      {badge.Description}
                    </Typography>

                    <Box sx={{ mt: 'auto' }}>
                      <Chip 
                        label={hasEarned ? '✅ Đã đạt' : `🎯 Cần ${badge.Requirement} ngày`}
                        size="small"
                        sx={{ 
                          fontSize: '11px',
                          height: '24px',
                          backgroundColor: hasEarned ? '#22c55e' : '#f59e0b',
                          color: 'white',
                          fontWeight: 600,
                          mb: hasEarned && userBadgeInfo ? 1 : 0,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      />
                      
                      {hasEarned && userBadgeInfo && (
                        <Typography variant="caption" sx={{ 
                          display: 'block', 
                          fontSize: '11px',
                          color: 'rgba(255,255,255,0.9)',
                          fontWeight: 500
                        }}>
                          📅 {new Date(userBadgeInfo.AwardedAt).toLocaleDateString('vi-VN')}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Paper>

      {/* Legacy Achievements (if any) */}
      {achievements.length > 0 && (
        <Paper sx={{ p: 4, borderRadius: 4, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#334155', mb: 3, textAlign: 'center' }}>
            📜 Thành Tích Khác
          </Typography>
          <Grid container spacing={3}>
            {achievements.map((achievement, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6">{achievement.title}</Typography>
                    <Typography color="textSecondary">
                      {achievement.description}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Đạt được: {new Date(achievement.date).toLocaleDateString('vi-VN')}
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
      )}
    </Container>
  );
};

export default AchievementsPage;