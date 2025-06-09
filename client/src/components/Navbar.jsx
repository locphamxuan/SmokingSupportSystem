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
    <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
          Smoking Support
        </Typography>
        {isMobile ? (
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {menuItems.map((item) => (
              <Button key={item.text} color="inherit" onClick={() => navigate(item.path)}>
                {item.text}
              </Button>
            ))}
            {user ? (
              <>
                <IconButton
                  size="large"
                  edge="end"
                  aria-label="tài khoản người dùng hiện tại"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <Avatar sx={{ bgcolor: '#e91e63' }}>
                    {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                </IconButton>
                <Menu
                  id="menu-appbar"
                  anchorEl={anchorEl}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  keepMounted
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={handleProfileRedirect}>
                    <MuiListItemIcon>
                      <PersonIcon fontSize="small" />
                    </MuiListItemIcon>
                    <ListItemText>Hồ sơ của tôi</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <MuiListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </MuiListItemIcon>
                    <ListItemText>Đăng xuất</ListItemText>
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button color="inherit" onClick={() => navigate('/login')}>Đăng nhập</Button>
              </>
            )}
          </Box>
        )}
      </Toolbar>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawerList()}
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
