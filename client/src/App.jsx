import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import BlogPage from './pages/BlogPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminUserPage from './pages/AdminUserPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import SubscriptionPlans from './pages/SubscriptionPlans';
import MyProgressPage from './pages/MyProgressPage';
import AchievementsPage from './pages/AchievementsPage';
import ChatCoachPage from './pages/ChatCoachPage';
import CoachChatPage from './pages/CoachChatPage';
import CoachDashboardPage from './pages/CoachDashboardPage';
import CoachMemberProgressPage from './pages/CoachMemberProgressPage';

// Cấu hình theme cho Material-UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Component bảo vệ route - kiểm tra quyền truy cập
const ProtectedRoute = ({ children, requireAdmin = false, requireCoach = false }) => {
  const userStr = localStorage.getItem('user');
  let user = null;
  try {
    if (userStr && userStr !== 'undefined') {
      user = JSON.parse(userStr);
    }
  } catch (e) {
    user = null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (requireCoach && user.role !== 'coach') {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router future={{ v7_relativeSplatPath: true }}>
        <Navbar />
        <Routes>
          {/* Các route công khai */}
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Các route yêu cầu đăng nhập */}
          <Route path="/my-progress" element={<MyProgressPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/subscription" 
            element={
              <ProtectedRoute>
                <SubscriptionPlans />
              </ProtectedRoute>
            } 
          />
          <Route path="/chat-coach/:coachId" element={<ChatCoachPage />} />
          
          {/* Các route dành cho huấn luyện viên */}
          <Route 
            path="/coach/dashboard" 
            element={
              <ProtectedRoute requireCoach={true}>
                <CoachDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/coach/chat/:memberId" 
            element={
              <ProtectedRoute requireCoach={true}>
                <CoachChatPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/coach/member/:memberId/progress" 
            element={
              <ProtectedRoute requireCoach={true}>
                <CoachMemberProgressPage />
              </ProtectedRoute>
            } 
          />

          {/* Các route dành cho quản trị viên */}
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminUserPage />
              </ProtectedRoute>
            } 
          />
            
          {/* Route mặc định - chuyển hướng về trang chủ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;