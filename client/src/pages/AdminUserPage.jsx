// Giao diện trang quản lý người dùng cho admin
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
  Card,
  CardContent,
  Chip,
  Tooltip
} from "@mui/material";
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  People as PeopleIcon,
  WorkspacePremium as PremiumIcon,
  SupportAgent as CoachIcon,
  Search as SearchIcon,
  Dashboard as DashboardIcon
} from "@mui/icons-material";
import { getUsers, getUserDetail, updateUser, deleteUser } from "../services/adminService";

const AdminUserPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [formData, setFormData] = useState({
    id: "",
    username: "",
    email: "",
    phoneNumber: "",
    address: "",
    role: "",
    isMember: false
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const getUserRole = (user) => {
    // Kiểm tra nếu user có IsMember = 1 thì coi là member (thành viên premium)
    if (user.isMember === 1 || user.isMember === true) {
      return "member";
    }
    
    // Ưu tiên role từ database nếu có
    if (user.role) {
      return user.role.toLowerCase();
    }
    
    // Logic dự phòng cho các trường hợp dữ liệu cũ hoặc không xác định
    if (user.isAdmin === 1) return "admin"; // Nếu là admin
    return "guest"; // Mặc định là khách hàng
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin": return "#f44336"; // Màu đỏ cho Quản trị viên
      case "coach": return "#2196f3"; // Màu xanh dương cho Huấn luyện viên
      case "member": return "#ff9800"; // Màu cam cho Thành viên
      case "guest": return "#9e9e9e"; // Màu xám cho Khách hàng
      default: return "#9e9e9e";
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "admin": return "Quản trị viên";
      case "coach": return "Huấn luyện viên";
      case "member": return "Thành viên";
      case "guest": return "Khách hàng";
      default: return "Khách hàng";
    }
  };

  const filterUsers = useCallback(() => {
    let filtered = users;

    // Bỏ user admin khỏi danh sách hiển thị cho admin
    filtered = filtered.filter(user => user.role !== 'admin');

    // Lọc theo từ khóa tìm kiếm (username hoặc email)
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Lọc theo vai trò
    if (roleFilter === "member") {
      filtered = filtered.filter(user => {
        const role = getUserRole(user);
        return role === "member" || user.isMember === true || user.isMember === 1;
      });
    } else if (roleFilter === "guest") {
      filtered = filtered.filter(user => {
        const role = getUserRole(user);
        return role === "guest" && !user.isMember;
      });
    } else if (roleFilter === "coach") {
      filtered = filtered.filter(user => getUserRole(user) === "coach");
    } else if (roleFilter !== "all") {
      filtered = filtered.filter(user => {
        const userRole = getUserRole(user);
        return userRole === roleFilter;
      });
    }

    // Sắp xếp danh sách đã lọc theo ID tăng dần
    const sortedFiltered = filtered.sort((a, b) => a.id - b.id);
    setFilteredUsers(sortedFiltered);
  }, [users, searchTerm, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const fetchUsers = async () => {
    try {
      console.log('Đang tải người dùng...');
      const data = await getUsers();
      console.log('Dữ liệu người dùng nhận được:', data);
      
      // Kiểm tra định dạng dữ liệu nhận được
      if (!data || !Array.isArray(data)) {
        console.error('Định dạng dữ liệu không hợp lệ:', data);
        setSnackbar({
          open: true,
          message: "Dữ liệu người dùng không hợp lệ",
          severity: "error",
        });
        return;
      }

      // Chuyển đổi các thuộc tính từ PascalCase sang camelCase để dễ xử lý trong React
      const formattedData = data.map(user => ({
        id: user.Id,
        username: user.Username,
        email: user.Email,
        phoneNumber: user.PhoneNumber,
        address: user.Address,
        role: user.Role,
        isMember: user.IsMember,
        createdAt: user.CreatedAt
      }));

      // Sắp xếp danh sách đã định dạng theo ID tăng dần
      const sortedData = formattedData.sort((a, b) => a.id - b.id);
      console.log('Dữ liệu người dùng đã sắp xếp:', sortedData);
      setUsers(sortedData);
    } catch (error) {
      console.error("Lỗi khi tải danh sách người dùng:", error);
      console.error("Chi tiết lỗi:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = "Lỗi khi tải danh sách người dùng";
      
      // Xử lý các loại lỗi cụ thể
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        } else if (error.response.status === 403) {
          errorMessage = "Bạn không có quyền truy cập trang này.";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
  };

  const getStatistics = () => {
    // Lọc bỏ admin khỏi thống kê
    const filteredUsers = users.filter(user => user.role !== 'admin');
    const coachCount = filteredUsers.filter(user => getUserRole(user) === "coach").length;
    const memberCount = filteredUsers.filter(user => {
      const role = getUserRole(user);
      return role === "member" || user.isMember === true || user.isMember === 1;
    }).length;
    const guestCount = filteredUsers.filter(user => {
      const role = getUserRole(user);
      return role === "guest" && !user.isMember;
    }).length;
    const totalUsers = filteredUsers.length;
    return { coachCount, memberCount, guestCount, totalUsers };
  };

  const handleEdit = (user) => {
    setFormData({
      id: user.id,
      username: user.username || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      address: user.address || "",
      role: user.role || "guest", // Đặt vai trò mặc định là 'guest' nếu không có
      isMember: user.isMember || false // Đặt mặc định là false nếu không có
    });
    setOpen(true); // Mở dialog chỉnh sửa
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      id: "",
      username: "",
      email: "",
      phoneNumber: "",
      address: "",
      role: "",
      isMember: false
    });
  };

  const handleSave = async () => {
    try {
      const updatedUser = await updateUser(formData.id, formData);
      // Cập nhật người dùng trong danh sách hiển thị
      setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
      setSnackbar({
        open: true,
        message: "Cập nhật người dùng thành công!",
        severity: "success",
      });
      handleClose(); // Đóng dialog sau khi lưu
    } catch (error) {
      console.error("Lỗi khi cập nhật người dùng:", error);
      let errorMessage = "Cập nhật người dùng thất bại.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này không?")) {
      try {
        await deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId)); // Xóa người dùng khỏi danh sách
        setSnackbar({
          open: true,
          message: "Xóa người dùng thành công!",
          severity: "success",
        });
      } catch (error) {
        console.error("Lỗi khi xóa người dùng:", error);
        let errorMessage = "Xóa người dùng thất bại.";
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: "error",
        });
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleViewUserDetail = async (userId) => {
    try {
      const data = await getUserDetail(userId);
      setSelectedUserDetail(data);
      setDetailOpen(true); // Mở dialog chi tiết
    } catch (error) {
      console.error("Lỗi khi tải chi tiết người dùng:", error);
      let errorMessage = "Không thể tải chi tiết người dùng.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedUserDetail(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const { coachCount, memberCount, guestCount, totalUsers } = getStatistics();

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #28a745 0%, #20c997 50%, #17a2b8 100%)',
      pt: { xs: 15, sm: 16, md: 18 },
      pb: 3
    }}>
      <Container maxWidth="xl" sx={{ 
        pt: 2
      }}>
        <Box sx={{
          background: 'rgba(45, 55, 72, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          p: 4,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #28a745, #20c997, #17a2b8)'
          }
        }}>
          <Typography variant="h5" component="h1" gutterBottom sx={{ 
            color: '#e2e8f0', 
            fontWeight: 'bold',
            mb: 3,
            textAlign: 'center'
          }}>
            <DashboardIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Quản Lý Người Dùng
          </Typography>

          {/* Thẻ thống kê người dùng */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3} md={3}>
              <Card elevation={0} sx={{ 
                borderRadius: 2, 
                background: 'linear-gradient(135deg, #28a745 30%, #20c997 90%)', 
                color: 'white',
                height: '100px',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)'
                }
              }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        Tổng số Người dùng
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{totalUsers}</Typography>
                    </Box>
                    <PeopleIcon sx={{ fontSize: 32, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3} md={3}>
              <Card elevation={0} sx={{ 
                borderRadius: 2, 
                background: 'linear-gradient(135deg, #20c997 30%, #17a2b8 90%)', 
                color: 'white',
                height: '100px',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)'
                }
              }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        Thành viên Premium
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{memberCount}</Typography>
                    </Box>
                    <PremiumIcon sx={{ fontSize: 32, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3} md={3}>
              <Card elevation={0} sx={{ 
                borderRadius: 2, 
                background: 'linear-gradient(135deg, #17a2b8 30%, #28a745 90%)', 
                color: 'white',
                height: '100px',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)'
                }
              }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        Huấn luyện viên
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{coachCount}</Typography>
                    </Box>
                    <CoachIcon sx={{ fontSize: 32, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3} md={3}>
              <Card elevation={0} sx={{ 
                borderRadius: 2, 
                background: 'linear-gradient(135deg, #6c757d 30%, #495057 90%)', 
                color: 'white',
                height: '100px',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)'
                }
              }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        Khách hàng
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{guestCount}</Typography>
                    </Box>
                    <PeopleIcon sx={{ fontSize: 32, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper elevation={2} sx={{ 
            p: 3, 
            borderRadius: 2, 
            background: 'white'
          }}>
            {/* Thanh tìm kiếm và bộ lọc vai trò */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Tìm kiếm (Tên đăng nhập/Email)"
                variant="outlined"
                size="small"
                sx={{ 
                  flexGrow: 1, 
                  mr: 2, 
                  mb: { xs: 2, sm: 0 },
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#28a745'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#28a745'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    '&.Mui-focused': {
                      color: '#28a745'
                    }
                  }
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <SearchIcon color="action" />
                  ),
                }}
              />
              <FormControl sx={{ 
                minWidth: 180,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#28a745'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#28a745'
                  }
                },
                '& .MuiInputLabel-root': {
                  '&.Mui-focused': {
                    color: '#28a745'
                  }
                }
              }} size="small">
                <InputLabel>Lọc theo vai trò</InputLabel>
                <Select
                  value={roleFilter}
                  label="Lọc theo vai trò"
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="member">Thành viên</MenuItem>
                  <MenuItem value="coach">Huấn luyện viên</MenuItem>
                  <MenuItem value="guest">Khách hàng</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Bảng danh sách người dùng */}
            <TableContainer component={Paper} elevation={0}>
              <Table sx={{ minWidth: 650 }} aria-label="Bảng người dùng" size="small">
                <TableHead>
                  <TableRow sx={{ 
                    background: 'linear-gradient(90deg, #28a745, #20c997, #17a2b8)',
                  }}>
                    <TableCell sx={{ fontWeight: 'bold', py: 1, color: 'white' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 1, color: 'white' }}>Tên đăng nhập</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 1, color: 'white' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 1, color: 'white' }}>Số điện thoại</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', py: 1, color: 'white' }}>Vai trò</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', py: 1, color: 'white' }}>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 2 }}>
                        Không tìm thấy người dùng nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} sx={{ 
                        '&:hover': { 
                          backgroundColor: '#f5f5f5'
                        }
                      }}>
                        <TableCell sx={{ py: 1 }}>{user.id}</TableCell>
                        <TableCell sx={{ py: 1 }}>{user.username}</TableCell>
                        <TableCell sx={{ py: 1 }}>{user.email}</TableCell>
                        <TableCell sx={{ py: 1 }}>{user.phoneNumber}</TableCell>
                        <TableCell sx={{ py: 1 }}>
                          <Chip 
                            label={getRoleLabel(getUserRole(user))}
                            size="small"
                            sx={{ 
                              backgroundColor: getRoleColor(getUserRole(user)), 
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.75rem'
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ py: 1 }}>
                          <Tooltip title="Chỉnh sửa">
                            <IconButton 
                              onClick={() => handleEdit(user)} 
                              color="primary"
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xóa">
                            <IconButton 
                              onClick={() => handleDelete(user.id)} 
                              color="secondary"
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Xem chi tiết">
                            <Button 
                              variant="outlined" 
                              size="small" 
                              sx={{ 
                                ml: 0.5, 
                                fontSize: '0.75rem', 
                                px: 1
                              }} 
                              onClick={() => handleViewUserDetail(user.id)}
                            >
                              Chi tiết
                            </Button>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
          </Table>
        </TableContainer>
      </Paper>

          {/* Dialog chỉnh sửa người dùng */}
          <Dialog 
            open={open} 
            onClose={handleClose}
          >
            <DialogTitle>
              Chỉnh sửa Người dùng
            </DialogTitle>
            <DialogContent>
              <TextField
                margin="dense"
                label="Tên đăng nhập"
                type="text"
                fullWidth
                variant="outlined"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
              />
              <TextField
                margin="dense"
                label="Email"
                type="email"
                fullWidth
                variant="outlined"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              <TextField
                margin="dense"
                label="Số điện thoại"
                type="text"
                fullWidth
                variant="outlined"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
              />
              <TextField
                margin="dense"
                label="Địa chỉ"
                type="text"
                fullWidth
                variant="outlined"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Vai trò</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  label="Vai trò"
                  onChange={handleInputChange}
                >
                  <MenuItem value="member">Thành viên</MenuItem>
                  <MenuItem value="coach">Huấn luyện viên</MenuItem>
                  <MenuItem value="guest">Khách hàng</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Hủy</Button>
              <Button onClick={handleSave} variant="contained" color="primary">
                Lưu
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog xem chi tiết người dùng */}
          <Dialog 
            open={detailOpen} 
            onClose={handleCloseDetail} 
            maxWidth="md" 
            fullWidth
          >
            <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>
              Chi tiết Người dùng - {selectedUserDetail ? getRoleLabel(selectedUserDetail.role) : ''}
            </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedUserDetail ? (
            <Box>
              {/* Thông tin cơ bản */}
              <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
                  📋 Thông tin cá nhân
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">ID:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: '500' }}>{selectedUserDetail.id}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Tên đăng nhập:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: '500' }}>{selectedUserDetail.username}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Email:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: '500' }}>{selectedUserDetail.email}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Số điện thoại:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: '500' }}>{selectedUserDetail.phoneNumber || 'Chưa cập nhật'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Địa chỉ:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: '500' }}>{selectedUserDetail.address || 'Chưa cập nhật'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Ngày tạo:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: '500' }}>
                      {selectedUserDetail.createdAt ? new Date(selectedUserDetail.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Thông tin hút thuốc */}
              {selectedUserDetail.smokingProfile && (
                <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#f57c00' }}>
                    🚬 Thông tin hút thuốc
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Số điếu/ngày:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: '500' }}>{selectedUserDetail.smokingProfile.cigarettesPerDay}</Typography>
                    </Grid>
                                         <Grid item xs={6}>
                       <Typography variant="body2" color="textSecondary">Tần suất hút:</Typography>
                       <Typography variant="body1" sx={{ fontWeight: '500' }}>{selectedUserDetail.smokingProfile.smokingFrequency || 'N/A'}</Typography>
                     </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Giá/gói:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: '500' }}>{selectedUserDetail.smokingProfile.costPerPack?.toLocaleString('vi-VN')} VNĐ</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Loại thuốc:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: '500' }}>{selectedUserDetail.smokingProfile.cigaretteType || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">Lý do cai thuốc:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: '500' }}>{selectedUserDetail.smokingProfile.quitReason || 'Chưa cập nhật'}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {/* Thông tin theo role Coach */}
              {selectedUserDetail.role === 'coach' && (
                <>
                  <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: '#e3f2fd' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
                      👨‍⚕️ Thông tin Huấn luyện viên
                    </Typography>
                    
                    {selectedUserDetail.assignedMembers && selectedUserDetail.assignedMembers.length > 0 ? (
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                          Thành viên được phụ trách ({selectedUserDetail.assignedMembers.length} người):
                        </Typography>
                        <Grid container spacing={2}>
                          {selectedUserDetail.assignedMembers.map(member => (
                            <Grid item xs={12} key={member.id}>
                              <Card variant="outlined" sx={{ p: 2 }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={4}>
                                    <Typography variant="body2" color="textSecondary">Tên:</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: '500' }}>{member.username}</Typography>
                                  </Grid>
                                  <Grid item xs={4}>
                                    <Typography variant="body2" color="textSecondary">Email:</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: '500' }}>{member.email}</Typography>
                                  </Grid>
                                                                     <Grid item xs={4}>
                                     <Typography variant="body2" color="textSecondary">Điếu/ngày:</Typography>
                                     <Typography variant="body1" sx={{ fontWeight: '500' }}>{member.cigarettesPerDay}</Typography>
                                   </Grid>
                                   <Grid item xs={6}>
                                     <Typography variant="body2" color="textSecondary">Trạng thái booking:</Typography>
                                     <Chip 
                                       label={member.bookingStatus || 'Chưa có'} 
                                       size="small"
                                       color={member.bookingStatus === 'đã xác nhận' ? 'success' : 
                                              member.bookingStatus === 'đã hủy' ? 'error' : 'warning'}
                                     />
                                   </Grid>
                                   <Grid item xs={6}>
                                     <Typography variant="body2" color="textSecondary">Lịch hẹn:</Typography>
                                     <Typography variant="body1" sx={{ fontWeight: '500' }}>
                                       {member.scheduledTime ? new Date(member.scheduledTime).toLocaleDateString('vi-VN') : 'Chưa có'}
                                     </Typography>
                                   </Grid>
                                   <Grid item xs={12}>
                                     <Typography variant="body2" color="textSecondary">Lý do cai:</Typography>
                                     <Typography variant="body1" sx={{ fontWeight: '500' }}>{member.quitReason || 'Chưa cập nhật'}</Typography>
                                   </Grid>
                                </Grid>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    ) : (
                      <Typography variant="body1" color="textSecondary">
                        Chưa có thành viên được phân công
                      </Typography>
                    )}
                  </Paper>

                  {/* Tiến độ gần đây của members */}
                  {selectedUserDetail.recentProgress && selectedUserDetail.recentProgress.length > 0 && (
                    <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#388e3c' }}>
                        📈 Tiến độ gần đây (7 ngày)
                      </Typography>
                      <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                        {selectedUserDetail.recentProgress.map((progress, index) => (
                          <Card key={index} variant="outlined" sx={{ mb: 1, p: 2 }}>
                            <Grid container spacing={2}>
                              <Grid item xs={3}>
                                <Typography variant="body2" color="textSecondary">Thành viên:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: '500' }}>{progress.username}</Typography>
                              </Grid>
                              <Grid item xs={3}>
                                <Typography variant="body2" color="textSecondary">Ngày:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: '500' }}>
                                  {new Date(progress.date).toLocaleDateString('vi-VN')}
                                </Typography>
                              </Grid>
                              <Grid item xs={3}>
                                <Typography variant="body2" color="textSecondary">Điếu hút:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: '500' }}>{progress.cigarettesSmoked}</Typography>
                              </Grid>
                              <Grid item xs={3}>
                                <Typography variant="body2" color="textSecondary">Ghi chú:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: '500' }}>{progress.notes || 'Không có'}</Typography>
                              </Grid>
                            </Grid>
                          </Card>
                        ))}
                      </Box>
                    </Paper>
                  )}
                </>
              )}

              {/* Thông tin theo role Member/Guest */}
              {(selectedUserDetail.role === 'member' || selectedUserDetail.role === 'guest') && (
                <>
                  {/* Thông tin coach được assign */}
                  {selectedUserDetail.assignedCoach ? (
                    <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: '#f3e5f5' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#7b1fa2' }}>
                        👨‍⚕️ Huấn luyện viên phụ trách
                      </Typography>
                                             <Grid container spacing={2}>
                         <Grid item xs={4}>
                           <Typography variant="body2" color="textSecondary">Tên:</Typography>
                           <Typography variant="body1" sx={{ fontWeight: '500' }}>{selectedUserDetail.assignedCoach.username}</Typography>
                         </Grid>
                         <Grid item xs={4}>
                           <Typography variant="body2" color="textSecondary">Email:</Typography>
                           <Typography variant="body1" sx={{ fontWeight: '500' }}>{selectedUserDetail.assignedCoach.email}</Typography>
                         </Grid>
                         <Grid item xs={4}>
                           <Typography variant="body2" color="textSecondary">SĐT:</Typography>
                           <Typography variant="body1" sx={{ fontWeight: '500' }}>{selectedUserDetail.assignedCoach.phoneNumber || 'N/A'}</Typography>
                         </Grid>
                         <Grid item xs={6}>
                           <Typography variant="body2" color="textSecondary">Trạng thái booking:</Typography>
                           <Chip 
                             label={selectedUserDetail.assignedCoach.bookingStatus || 'Chưa có'} 
                             size="small"
                             color={selectedUserDetail.assignedCoach.bookingStatus === 'đã xác nhận' ? 'success' : 
                                    selectedUserDetail.assignedCoach.bookingStatus === 'đã hủy' ? 'error' : 'warning'}
                           />
                         </Grid>
                         <Grid item xs={6}>
                           <Typography variant="body2" color="textSecondary">Lịch hẹn:</Typography>
                           <Typography variant="body1" sx={{ fontWeight: '500' }}>
                             {selectedUserDetail.assignedCoach.scheduledTime ? 
                               new Date(selectedUserDetail.assignedCoach.scheduledTime).toLocaleString('vi-VN') : 'Chưa có'}
                           </Typography>
                         </Grid>
                         {selectedUserDetail.assignedCoach.bookingNote && (
                           <Grid item xs={12}>
                             <Typography variant="body2" color="textSecondary">Ghi chú booking:</Typography>
                             <Typography variant="body1" sx={{ fontWeight: '500' }}>{selectedUserDetail.assignedCoach.bookingNote}</Typography>
                           </Grid>
                         )}
                       </Grid>
                    </Paper>
                  ) : (
                    <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#fff3e0' }}>
                      <Typography variant="body1" color="textSecondary" align="center">
                        🔍 Chưa được phân công huấn luyện viên
                      </Typography>
                    </Paper>
                  )}

                  {/* Kế hoạch cai thuốc */}
                  {selectedUserDetail.quitPlan && (
                    <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: '#e8f5e8' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#2e7d32' }}>
                        🎯 Kế hoạch cai thuốc
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">Ngày bắt đầu:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '500' }}>
                            {new Date(selectedUserDetail.quitPlan.startDate).toLocaleDateString('vi-VN')}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">Ngày kết thúc:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '500' }}>
                            {new Date(selectedUserDetail.quitPlan.endDate).toLocaleDateString('vi-VN')}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">Loại mục tiêu:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '500' }}>{selectedUserDetail.quitPlan.goalType}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">Giá trị mục tiêu:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '500' }}>{selectedUserDetail.quitPlan.goalValue}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary">Mô tả:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '500' }}>{selectedUserDetail.quitPlan.description}</Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  )}

                  {/* Tiến độ cá nhân */}
                  {selectedUserDetail.progress && selectedUserDetail.progress.length > 0 && (
                    <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
                        📊 Tiến độ cá nhân
                      </Typography>
                      <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                        {selectedUserDetail.progress.slice(0, 10).map((progress, index) => (
                          <Card key={index} variant="outlined" sx={{ mb: 1, p: 2 }}>
                            <Grid container spacing={2}>
                              <Grid item xs={4}>
                                <Typography variant="body2" color="textSecondary">Ngày:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: '500' }}>
                                  {new Date(progress.date).toLocaleDateString('vi-VN')}
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" color="textSecondary">Điếu hút:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: '500' }}>{progress.cigarettesSmoked}</Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" color="textSecondary">Ghi chú:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: '500' }}>{progress.notes || 'Không có'}</Typography>
                              </Grid>
                            </Grid>
                          </Card>
                        ))}
                      </Box>
                      {selectedUserDetail.progress.length > 10 && (
                        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
                          Hiển thị 10 bản ghi gần nhất / Tổng: {selectedUserDetail.progress.length}
                        </Typography>
                      )}
                    </Paper>
                  )}
                </>
              )}
            </Box>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
              <Typography>Đang tải chi tiết người dùng...</Typography>
            </Box>
          )}
        </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid #eee', pt: 2 }}>
              <Button onClick={handleCloseDetail} variant="contained" color="primary">
                Đóng
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar thông báo */}
          <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
            <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Container>
    </Box>
  );
};

export default AdminUserPage;
