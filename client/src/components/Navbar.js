import React, { useState } from "react";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Avatar,
  Menu,
  MenuItem,
  IconButton
} from "@mui/material";
import { 
  Home as HomeIcon,
  SmokeFree as SmokeIcon,
  WorkspacePremium as PremiumIcon
} from "@mui/icons-material";
import { Link as RouterLink, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;
  const userStr = localStorage.getItem('user');
  let user = null;
  try {
    if (userStr && userStr !== 'undefined') {
      user = JSON.parse(userStr);
    }
  } catch (e) {
    user = null;
  }
  const isAdmin = user && user.role === 'admin';

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    handleClose();
    navigate('/login');
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#2d3748' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Logo bên trái */}
        <Box 
          component={RouterLink} 
          to="/" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            textDecoration: 'none', 
            color: 'inherit',
            '&:hover': {
              opacity: 0.8
            }
          }}
        >
          <SmokeIcon sx={{ fontSize: 32, mr: 1, color: '#68d391' }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            🚭 Cai Thuốc Lá
          </Typography>
        </Box>
        
        {/* Navigation buttons ở giữa */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button 
            color="inherit" 
            component={RouterLink} 
            to="/"
            startIcon={<HomeIcon />}
          >
            Trang chủ
          </Button>
          <Button color="inherit" component={RouterLink} to="/blog">
            Blog
          </Button>
          <Button color="inherit" component={RouterLink} to="/leaderboard">
            Bảng xếp hạng
          </Button>
          {isLoggedIn && !isAdmin && (
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/subscription"
              startIcon={<PremiumIcon />}
              sx={{
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 193, 7, 0.2)',
                }
              }}
            >
              Gói Premium
            </Button>
          )}
        </Box>

        {/* User menu bên phải */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isLoggedIn ? (
            <>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
                sx={{ ml: 2 }}
              >
                <Avatar sx={{ width: 32, height: 32 }} />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                {!isAdmin && (
                  <MenuItem 
                    onClick={() => {
                      handleClose();
                      navigate('/profile');
                    }}
                  >
                    Hồ sơ cá nhân
                  </MenuItem>
                )}
                {isAdmin && (
                  <MenuItem
                    onClick={() => {
                      handleClose();
                      navigate('/admin/users');
                    }}
                  >
                    Quản lý tài khoản
                  </MenuItem>
                )}
                {!isAdmin && (
                  <MenuItem 
                    onClick={() => {
                      handleClose();
                      navigate('/my-progress');
                    }}
                  >
                    Theo dõi quá trình
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>Đăng xuất</MenuItem>
              </Menu>
            </>
          ) : (
            <Button color="inherit" component={RouterLink} to="/login">
              Đăng nhập
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
