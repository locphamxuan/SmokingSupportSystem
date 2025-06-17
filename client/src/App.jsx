import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import './App.css';
import MainLayout from './layouts/MainLayout'; // Thêm import MainLayout
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
import CoachChatPage from './pages/CoachChatPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import BookingPage from './pages/BookingPage.jsx';

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
  const { isAuthenticated, user } = useAuth();

  // Temporarily remove loading overlay for debugging
  // if (loading) {
  //   return (
  //     <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
  //       <CircularProgress />
  //     </Box>
  //   );
  // }

  if (!isAuthenticated) { 
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Cập nhật AppRoutes Component
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />

      {/* Routes with MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/about" element={<AboutPage />} />
        
        {/* Protected routes */}
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
          path="/chat-coach/:coachId" 
          element={
            <ProtectedRoute allowedRoles={['member']}> 
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
          element={<CoachChatPage />} 
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
        <Route
          path="/booking"
          element={
            <ProtectedRoute allowedRoles={['member', 'guest']}>
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
        <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;