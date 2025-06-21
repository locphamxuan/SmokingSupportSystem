import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import './App.css';
import MainLayout from './layouts/MainLayout'; // Thêm import MainLayout
import Navbar from './components/Navbar.jsx'; 
import HomePage from './pages/HomePage.jsx';
import CommunityPage from './pages/CommunityPage.jsx'; 
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
import CoachChatPage from './pages/CoachChatPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import BookingPage from './pages/BookingPage.jsx';
import CreatePostPage from './pages/CreatePostPage.jsx';
import TestPage from './pages/TestPage.jsx';

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
  const { isAuthenticated, user, loading } = useAuth();

  console.log('ProtectedRoute:', { isAuthenticated, user, loading, allowedRoles });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) { 
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    console.log('Role not allowed, redirecting to home');
    return <Navigate to="/" replace />;
  }

  return children;
};

// Cập nhật AppRoutes Component
const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  console.log('AppRoutes:', { isAuthenticated, loading });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />

      {/* Routes with MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/blog" element={<CommunityPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Các route công khai cho đăng nhập/đăng ký - chuyển hướng nếu đã đăng nhập */}
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
          
        {/* Route for creating a new post */}
        <Route
          path="/create-post"
          element={
            <ProtectedRoute allowedRoles={['member', 'memberVip', 'coach', 'admin']}> 
              <CreatePostPage />
            </ProtectedRoute>
          }
        />

        {/* Các route được bảo vệ */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRoles={['member', 'memberVip', 'coach', 'admin']}>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-progress" 
          element={
            <ProtectedRoute allowedRoles={['member', 'memberVip']}> 
              <MyProgressPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chat-coach/:coachId" 
          element={
            <ProtectedRoute allowedRoles={['member', 'memberVip']}> 
              <ChatCoachPage />
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
          path="/coach/chat/:memberId" 
          element={
            <ProtectedRoute allowedRoles={['coach']}>
              <CoachChatPage />
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
          path="/subscribe" 
          element={
            <ProtectedRoute allowedRoles={['member', 'memberVip']}> 
              <SubscriptionPlans />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/achievements" 
          element={
            <ProtectedRoute allowedRoles={['member', 'memberVip', 'coach', 'admin']}> 
              <AchievementsPage />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/booking"
          element={
            <ProtectedRoute allowedRoles={['member', 'memberVip']}>
              <BookingPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;