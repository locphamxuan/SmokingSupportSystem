//quản lý member cho admin

<<<<<<< HEAD
import React, { useEffect, useState } from "react";
import { getUsers, updateUser, deleteUser } from "../services/adminService";
=======
import React, { useState, useEffect, useCallback } from "react";
>>>>>>> Loc
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
<<<<<<< HEAD
  Typography,
  Box,
  Chip,
  Container,
  Paper,
  Card,
  CardContent,
  Grid,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  TableContainer,
  TablePagination,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
=======
  FormControl,
  InputLabel,
  Grid,
  Chip
} from "@mui/material";
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon
>>>>>>> Loc
} from "@mui/icons-material";
import { getUsers, updateUser, deleteUser } from "../services/adminService";

const AdminUserPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
<<<<<<< HEAD
  const [editUser, setEditUser] = useState(null);
  const [editData, setEditData] = useState({});
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();
=======
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
>>>>>>> Loc

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

<<<<<<< HEAD
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const statsData = [
    {
      title: "Tổng người dùng",
      value: filteredUsers.length,
      icon: <PeopleIcon />,
      color: "primary.main"
    },
    {
      title: "Người dùng thường",
      value: filteredUsers.filter(u => u.role === 'user').length,
      icon: <PersonAddIcon />,
      color: "info.main"
    },
    {
      title: "Người dùng Premium",
      value: filteredUsers.filter(u => u.role === 'premium').length,
      icon: <PersonAddIcon />,
      color: "warning.main"
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <PeopleIcon />
          </Avatar>
          Quản lý tài khoản người dùng
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Quản lý và theo dõi thông tin tài khoản của người dùng trong hệ thống
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsData.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ 
              height: '100%',
              background: 'linear-gradient(45deg, #f5f5f5 30%, #ffffff 90%)',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {stat.value}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Card */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          {/* Filter and Actions Section */}
          <Box sx={{ 
            mb: 3, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FilterListIcon color="action" />
              <Typography variant="h6">Bộ lọc:</Typography>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Vai trò người dùng</InputLabel>
                <Select
                  value={roleFilter}
                  label="Vai trò người dùng"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="user">Người dùng thường</MenuItem>
                  <MenuItem value="premium">Người dùng Premium</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Làm mới dữ liệu">
                <IconButton onClick={fetchUsers} color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Table Section */}
          {filteredUsers.length === 0 ? (
            <Paper sx={{ 
              p: 6, 
              textAlign: 'center',
              background: 'linear-gradient(45deg, #f8f9fa 30%, #ffffff 90%)'
            }}>
              <PeopleIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                Chưa có tài khoản được đăng ký
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Hiện tại chưa có người dùng nào trong hệ thống
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: 'primary.main', color: 'white' } }}>
                    <TableCell><strong>Tên đăng nhập</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Vai trò</strong></TableCell>
                    <TableCell><strong>Số điện thoại</strong></TableCell>
                    <TableCell><strong>Địa chỉ</strong></TableCell>
                    <TableCell><strong>Ngày tạo</strong></TableCell>
                    <TableCell><strong>Số điếu/ngày</strong></TableCell>
                    <TableCell><strong>Giá hộp/gói</strong></TableCell>
                    <TableCell><strong>Tần suất</strong></TableCell>
                    <TableCell><strong>Sức khỏe</strong></TableCell>
                    <TableCell align="center"><strong>Hành động</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((user, index) => (
                    <TableRow 
                      key={user._id}
                      sx={{ 
                        '&:hover': { bgcolor: 'action.hover' },
                        '&:nth-of-type(odd)': { bgcolor: 'action.hover' }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                            {user.username?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">
                            {user.username}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role === 'premium' ? 'Premium' : 'Người dùng'} 
                          color={getRoleColor(user.role)}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>{user.phoneNumber || '---'}</TableCell>
                      <TableCell>{user.address || '---'}</TableCell>
                      <TableCell>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                          : "---"}
                      </TableCell>
                      <TableCell>{user.smokingStatus?.cigarettesPerDay || '---'}</TableCell>
                      <TableCell>{user.smokingStatus?.costPerPack || '---'}</TableCell>
                      <TableCell>{user.smokingStatus?.smokingFrequency || '---'}</TableCell>
                      <TableCell>{user.smokingStatus?.healthStatus || '---'}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="Chỉnh sửa">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleEdit(user)}
                              sx={{ 
                                '&:hover': { 
                                  bgcolor: 'primary.light',
                                  color: 'white'
                                }
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa tài khoản">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDelete(user._id)}
                              sx={{ 
                                '&:hover': { 
                                  bgcolor: 'error.light',
                                  color: 'white'
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredUsers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Số dòng mỗi trang:"
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}–${to} trong ${count !== -1 ? count : `hơn ${to}`}`
                }
              />
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog 
        open={!!editUser} 
        onClose={() => setEditUser(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <EditIcon />
          Cập nhật thông tin người dùng
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                label="Tên đăng nhập"
                name="username"
                value={editData.username || ""}
                onChange={handleEditChange}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                label="Email"
                name="email"
                value={editData.email || ""}
                onChange={handleEditChange}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" variant="outlined">
                <InputLabel>Vai trò</InputLabel>
                <Select
                  name="role"
                  value={editData.role || ""}
                  onChange={handleEditChange}
                  label="Vai trò"
                >
                  <MenuItem value="user">Người dùng</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                label="Số điện thoại"
                name="phoneNumber"
                value={editData.phoneNumber || ""}
                onChange={handleEditChange}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="normal"
                label="Địa chỉ"
                name="address"
                value={editData.address || ""}
                onChange={handleEditChange}
                fullWidth
                variant="outlined"
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                Thông tin hút thuốc
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                label="Số điếu thuốc/ngày"
                name="smokingStatus.cigarettesPerDay"
                value={editData.smokingStatus?.cigarettesPerDay || ""}
                onChange={(e) => setEditData({
                  ...editData,
                  smokingStatus: {
                    ...editData.smokingStatus,
                    cigarettesPerDay: e.target.value
                  }
                })}
                fullWidth
                variant="outlined"
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                label="Giá hộp/gói (VNĐ)"
                name="smokingStatus.costPerPack"
                value={editData.smokingStatus?.costPerPack || ""}
                onChange={(e) => setEditData({
                  ...editData,
                  smokingStatus: {
                    ...editData.smokingStatus,
                    costPerPack: e.target.value
                  }
                })}
                fullWidth
                variant="outlined"
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                label="Tần suất hút thuốc"
                name="smokingStatus.smokingFrequency"
                value={editData.smokingStatus?.smokingFrequency || ""}
                onChange={(e) => setEditData({
                  ...editData,
                  smokingStatus: {
                    ...editData.smokingStatus,
                    smokingFrequency: e.target.value
                  }
                })}
                fullWidth
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                label="Tình trạng sức khỏe"
                name="smokingStatus.healthStatus"
                value={editData.smokingStatus?.healthStatus || ""}
                onChange={(e) => setEditData({
                  ...editData,
                  smokingStatus: {
                    ...editData.smokingStatus,
                    healthStatus: e.target.value
                  }
                })}
                fullWidth
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button 
            onClick={() => setEditUser(null)}
            variant="outlined"
            size="large"
          >
            Hủy
          </Button>
          <Button 
            onClick={handleEditSave} 
            variant="contained"
            size="large"
            sx={{ minWidth: 120 }}
          >
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>
=======
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
>>>>>>> Loc
    </Container>
  );
};

export default AdminUserPage;