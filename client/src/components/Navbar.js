import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Smoking Support
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/">
            Trang chủ
          </Button>
          <Button color="inherit" component={RouterLink} to="/blog">
            Blog
          </Button>
          <Button color="inherit" component={RouterLink} to="/leaderboard">
            Bảng xếp hạng
          </Button>
          <Button color="inherit" component={RouterLink} to="/auth">
            Đăng nhập
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;