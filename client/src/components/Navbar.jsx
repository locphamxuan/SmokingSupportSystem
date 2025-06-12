import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  Avatar,
  ListItemIcon as MuiListItemIcon,
  ListItemButton
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import BookIcon from '@mui/icons-material/Book';
import StarIcon from '@mui/icons-material/Star';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Lấy thông tin người dùng từ localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    try {
      if (userStr && userStr !== 'undefined') {
        setUser(JSON.parse(userStr));
      }
    } catch (e) {
      console.error("Lỗi khi phân tích cú pháp user từ localStorage:", e);
      setUser(null);
    }
  }, []);

  // Xử lý đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    handleMenuClose();
  };

  // Xử lý mở/đóng menu profile
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Xử lý chuyển hướng đến trang profile
  const handleProfileRedirect = () => {
    navigate('/profile');
    handleMenuClose();
  };

  // Xử lý mở/đóng drawer (cho mobile)
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const menuItems = [
    { text: 'Trang chủ', path: '/', icon: <HomeIcon /> },
    { text: 'Blog', path: '/blog', icon: <BookIcon /> },
    { text: 'Bảng xếp hạng', path: '/leaderboard', icon: <LeaderboardIcon /> },
  ];

  if (user) {
    if (user.role === 'admin') {
      menuItems.push({ text: 'Quản lý người dùng', path: '/admin/users', icon: <DashboardIcon /> });
    } else if (user.role === 'coach') {
      menuItems.push({ text: 'Dashboard Huấn luyện viên', path: '/coach/dashboard', icon: <DashboardIcon /> });
    } else {
      // member hoặc guest
      menuItems.push(
        { text: 'Tiến trình của tôi', path: '/my-progress', icon: <PersonIcon /> },
        { text: 'Thành tích', path: '/achievements', icon: <StarIcon /> },
        { text: 'Gói nâng cấp', path: '/subscription', icon: <SubscriptionsIcon /> }
      );
    }
  }

  const drawerList = () => (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => navigate(item.path)}>
              <MuiListItemIcon>{item.icon}</MuiListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      {!user ? (
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate('/login')}> 
              <ListItemText primary="Đăng nhập" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate('/register')}> 
              <ListItemText primary="Đăng ký" />
            </ListItemButton>
          </ListItem>
        </List>
      ) : null}
    </Box>
  );

  return (
    <header className="header">
        <div className="header-container">
            <div className="header-left">
                <Link to="/" className="logo">
                  <img
                    src={logo}
                    alt="Logo"
                    className="logo-img"
                  />
                </Link>

                <nav className="nav">
                  <Link to="" className="nav-item">Trang chủ</Link>
                  <Link to="/blog" className="nav-item">Blog</Link>
                  <Link to="/leaderboard" className="nav-item">Bảng xếp hạng</Link>
                  <Link to="/community" className="nav-item">Cộng đồng</Link>
                  {isLoggedIn && !isAdmin && !isCoach && (
                    <Link to="/consult-coach" className="nav-item">Tư vấn trực tuyến</Link>
                  )}
                  {isLoggedIn && isCoach && (
                    <Link to="/coach-chat-members" className="nav-item">Trả lời chat</Link>
                  )}
                </nav>
              </div>

              <div className="header-right">
                {isLoggedIn ? (
                  <div className="user-menu">
                    <div
                      className="avatar-container"
                      onClick={() => setShowDropdown(!showDropdown)}
                    >
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'default'}`}
                        alt="User avatar"
                        className="user-avatar"
                      />
                    </div>
                    {showDropdown && (
                      <div className="dropdown-menu">
                        {!isAdmin && (
                          <Link to="/profile" className="dropdown-item">
                            Hồ sơ cá nhân
                          </Link>
                        )}
                        {isAdmin && (
                          <Link to="/admin/users" className="dropdown-item">
                            Quản lý tài khoản
                          </Link>
                        )}
                        {!isAdmin && !isCoach && (
                          <Link to="/my-progress" className="dropdown-item">
                            Theo dõi quá trình
                          </Link>
                        )}
                        {isCoach && (
                          <Link to="/coach-portal" className="dropdown-item">
                            Lịch tư vấn
                          </Link>
                        )}
                        <button onClick={handleLogout} className="dropdown-item">
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="auth-buttons">
                    <Link to="/register" className="nav-item">Đăng ký</Link>
                    <Link to="/login" className="btn-primary">Đăng nhập</Link>
                  </div>
                )}
              </div>
        </div>
    </header>
  );
};

export default Navbar;
