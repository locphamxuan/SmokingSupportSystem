// Giao diện trang quản lý người dùng cho admin
//quản lý user cho admin

import React, { useEffect, useState } from "react";
import { getUsers, updateUser, deleteUser } from "../services/adminService";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const AdminUserPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [editData, setEditData] = useState({});
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") {
      navigate("/"); // chuyển về trang chủ nếu không phải admin
    } else {
      // Nếu là admin, không cho vào trang profile hoặc trang mua gói
      if (["/profile", "/subscription", "/subscription-plans"].includes(window.location.pathname)) {
        navigate("/admin/users");
      }
      fetchUsers();
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // Lọc users chỉ hiển thị user và premium, không hiển thị admin
    let filtered = users.filter(user => user.role !== 'admin');
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
  }, [users, roleFilter]);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      // Lọc ra các tài khoản không phải admin
      const nonAdminUsers = data.filter(user => user.role !== 'admin');
      setUsers(nonAdminUsers);
    } catch (error) {
      alert("Không thể tải danh sách người dùng!");
    }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setEditData(user);
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    try {
      await updateUser(editUser._id, editData);
      setEditUser(null);
      fetchUsers();
      alert("Cập nhật thành công!");
    } catch (error) {
      alert("Có lỗi xảy ra khi cập nhật!");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) {
      try {
        await deleteUser(id);
        fetchUsers();
        alert("Xóa tài khoản thành công!");
      } catch (error) {
        alert("Có lỗi xảy ra khi xóa tài khoản!");
      }
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'premium':
        return 'warning';
      case 'user':
        return 'primary';
      default:
        return 'default';
    }
  };

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
    </Container>
  );
};

export default AdminUserPage;
