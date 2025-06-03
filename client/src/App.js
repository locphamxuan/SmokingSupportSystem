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
import ConsultCoachPage from './pages/ConsultCoachPage';
import BookConsultationPage from './pages/BookConsultationPage';
import ChatCoachPage from './pages/ChatCoachPage';
import CoachPortalPage from './pages/CoachPortalPage';
import CoachChatMembersPage from './pages/CoachChatMembersPage';
import CoachMemberListPage from './pages/CoachMemberListPage';
import CoachMemberDetailPage from './pages/CoachMemberDetailPage';

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

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
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

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router future={{ v7_relativeSplatPath: true }}>
        <Navbar />
        <Routes>
          <Route path="/my-progress" element={<MyProgressPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminUserPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<LoginPage />} />
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
          <Route path="/consult-coach" element={<ConsultCoachPage />} />
          <Route path="/book-consultation" element={<BookConsultationPage />} />
          <Route path="/chat-coach/:coachId" element={<ChatCoachPage />} />
          <Route path="/coach-portal" element={<CoachPortalPage />} />
          <Route path="/coach-chat-members" element={<CoachChatMembersPage />} />
          <Route path="/coach-members" element={<CoachMemberListPage />} />
          <Route path="/coach-member/:memberId" element={<CoachMemberDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;