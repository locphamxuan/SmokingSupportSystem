import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import BlogPage from './pages/BlogPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminUserPage from './pages/AdminUserPage';
import LoginPage from './pages/LoginPage';
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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/admin/users" element={<AdminUserPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;