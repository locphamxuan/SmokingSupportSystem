//quản lý member cho admin

import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Box,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip
} from "@mui/material";
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon
} from "@mui/icons-material";
import { getUsers, updateUser, deleteUser } from "../services/adminService";

const AdminUserPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "",
    phoneNumber: "",
    address: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const getUserRole = (user) => {
    // Sử dụng role từ database, nếu không có thì fallback
    if (user.role) {
      return user.role.toLowerCase();
    }
    
    // Fallback cho dữ liệu cũ
    if (user.isAdmin === 1) return "admin";
    if (user.isMember === 1) return "member";
    return "guest";
  };

  const filterUsers = useCallback(() => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => {
        const userRole = getUserRole(user);
        return userRole === roleFilter;
      });
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách người dùng:", error);
      setSnackbar({
        open: true,
        message: "Lỗi khi tải danh sách người dùng",
        severity: "error",
      });
    }
  };

  const getRoleDisplay = (role) => {
    switch (role) {
      case "admin": 
        return { label: "Quản trị viên", color: "error" };
      case "coach": 
        return { label: "Coaching", color: "info" };
      case "member": 
        return { label: "Khách hàng Premium", color: "warning" };
      case "guest": 
        return { label: "Khách hàng", color: "default" };
      default: 
        return { label: "Khách hàng", color: "default" };
    }
  };

  const getStatistics = () => {
    const adminCount = users.filter(user => getUserRole(user) === "admin").length;
    const coachCount = users.filter(user => getUserRole(user) === "coach").length;
    const memberCount = users.filter(user => getUserRole(user) === "member").length;
    const guestCount = users.filter(user => getUserRole(user) === "guest").length;
    
    return { adminCount, coachCount, memberCount, guestCount };
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      role: getUserRole(user),
      phoneNumber: user.phoneNumber || "",
      address: user.address || "",
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedUser(null);
    setFormData({
      username: "",
      email: "",
      role: "",
      phoneNumber: "",
      address: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Cập nhật role và các trường liên quan
      let isAdmin = 0;
      let isMember = 0;
      
      if (formData.role === 'admin') isAdmin = 1;
      if (formData.role === 'member') isMember = 1;

      await updateUser(selectedUser.id, {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        isAdmin,
        isMember,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
      });
      setSnackbar({
        open: true,
        message: "Cập nhật người dùng thành công",
        severity: "success",
      });
      handleClose();
      fetchUsers();
    } catch (error) {
      console.error("Lỗi khi cập nhật người dùng:", error);
      setSnackbar({
        open: true,
        message: "Lỗi khi cập nhật người dùng",
        severity: "error",
      });
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      try {
        await deleteUser(userId);
        setSnackbar({
          open: true,
          message: "Xóa người dùng thành công",
          severity: "success",
        });
        fetchUsers();
      } catch (error) {
        console.error("Lỗi khi xóa người dùng:", error);
        setSnackbar({
          open: true,
          message: "Lỗi khi xóa người dùng",
          severity: "error",
        });
      }
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const stats = getStatistics();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Quản lý tài khoản
      </Typography>

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#ffebee' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
              {stats.adminCount}
            </Typography>
            <Typography variant="body2">Quản trị viên</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              {stats.coachCount}
            </Typography>
            <Typography variant="body2">Coaching</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#fff3e0' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
              {stats.memberCount}
            </Typography>
            <Typography variant="body2">KH Premium</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#616161' }}>
              {stats.guestCount}
            </Typography>
            <Typography variant="body2">Khách hàng</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Lọc theo vai trò</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Lọc theo vai trò"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="admin">Quản trị viên</MenuItem>
                <MenuItem value="coach">Coaching</MenuItem>
                <MenuItem value="member">Khách hàng Premium</MenuItem>
                <MenuItem value="guest">Khách hàng</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="body2" color="text.secondary">
              Tổng: {filteredUsers.length}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Tên đăng nhập</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Vai trò</strong></TableCell>
              <TableCell><strong>Số điện thoại</strong></TableCell>
              <TableCell><strong>Địa chỉ</strong></TableCell>
              <TableCell><strong>Thao tác</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user, idx) => {
              const role = getUserRole(user);
              const roleInfo = getRoleDisplay(role);
              return (
                <TableRow key={user.id || idx} hover>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={roleInfo.label}
                      color={roleInfo.color}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{user.phoneNumber || "-"}</TableCell>
                  <TableCell>{user.address || "-"}</TableCell>
                  <TableCell>
                    <IconButton 
                      onClick={() => handleEdit(user)} 
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDelete(user.id)} 
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Tên đăng nhập"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Vai trò</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                label="Vai trò"
              >
                <MenuItem value="admin">Quản trị viên</MenuItem>
                <MenuItem value="coach">Coaching</MenuItem>
                <MenuItem value="member">Khách hàng Premium</MenuItem>
                <MenuItem value="guest">Khách hàng</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Số điện thoại"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              margin="normal"
            />
            <TextField
              fullWidth
              label="Địa chỉ"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminUserPage;