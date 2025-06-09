import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';

// Import components and pages (đảm bảo đuôi .jsx)
import Navbar from './components/Navbar.jsx'; 
import HomePage from './pages/HomePage.jsx';
import BlogPage from './pages/BlogPage.jsx'; 
import LeaderboardPage from './pages/LeaderboardPage.jsx'; 
import AdminUserPage from './pages/AdminUserPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Register from './pages/Register.jsx'; 
import ProfilePage from './pages/ProfilePage.jsx';
import MyProgressPage from './pages/MyProgressPage.jsx'; 
import CoachDashboardPage from './pages/CoachDashboardPage.jsx'; 
import CoachMemberProgressPage from './pages/CoachMemberProgressPage.jsx'; 
import ChatCoachPage from './pages/ChatCoachPage.jsx'; 
import SubscriptionPlans from './pages/SubscriptionPlans.jsx';
import AchievementsPage from './pages/AchievementsPage.jsx'; 

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

// Component bảo vệ route
const ProtectedRoute = ({ children, allowedRoles }) => {
  const userStr = localStorage.getItem('user');
  let user = null;
  try {
    if (userStr && userStr !== 'undefined') {
      user = JSON.parse(userStr);
    }
  } catch (e) {
    user = null;
  }

  const token = localStorage.getItem('token'); 

  if (!token || !user) { 
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const token = localStorage.getItem('token'); 

  return (
    <ThemeProvider theme={theme}>
      <Router future={{ v7_relativeSplatPath: true }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />

          {/* Các route công khai cho đăng nhập/đăng ký - chuyển hướng nếu đã đăng nhập */}
          <Route path="/login" element={!token ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/register" element={!token ? <Register /> : <Navigate to="/" />} />
          
          {/* Các route được bảo vệ */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute allowedRoles={['member', 'coach', 'admin', 'guest']}>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-progress" 
            element={
              <ProtectedRoute allowedRoles={['member', 'guest']}> 
                <MyProgressPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUserPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/coach/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <CoachDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/coach/member/:memberId/progress" 
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <CoachMemberProgressPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/coach/chat/:memberId" 
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <ChatCoachPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/subscription" 
            element={
              <ProtectedRoute allowedRoles={['member', 'guest']}> 
                <SubscriptionPlans />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/achievements" 
            element={
              <ProtectedRoute allowedRoles={['member', 'coach', 'admin', 'guest']}> 
                <AchievementsPage />
              </ProtectedRoute>
            } 
          />

          {/* Route dự phòng cho các đường dẫn không khớp */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;