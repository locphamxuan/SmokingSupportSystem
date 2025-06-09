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
  Avatar,
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
  const [selectedUser, setSelectedUser] = useState(null);
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
    setSelectedUser(user);
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
    setSelectedUser(null);
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#333', fontWeight: 'bold' }}>
        <DashboardIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Quản Lý Người Dùng
      </Typography>

      {/* Thẻ thống kê người dùng */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ borderRadius: 2, background: 'linear-gradient(45deg, #2196f3 30%, #21cbff 90%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                  Tổng số Người dùng
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', textAlign: 'right' }}>{totalUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ borderRadius: 2, background: 'linear-gradient(45deg, #ff9800 30%, #ffc107 90%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PremiumIcon sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                  Thành viên Premium
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', textAlign: 'right' }}>{memberCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ borderRadius: 2, background: 'linear-gradient(45deg, #4caf50 30%, #81c784 90%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CoachIcon sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                  Huấn luyện viên
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', textAlign: 'right' }}>{coachCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ borderRadius: 2, background: 'linear-gradient(45deg, #9e9e9e 30%, #bdbdbd 90%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                  Khách hàng
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', textAlign: 'right' }}>{guestCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        {/* Thanh tìm kiếm và bộ lọc vai trò */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
          <TextField
            label="Tìm kiếm (Tên đăng nhập/Email)"
            variant="outlined"
            sx={{ flexGrow: 1, mr: 2, mb: { xs: 2, sm: 0 } }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              endAdornment: (
                <SearchIcon color="action" />
              ),
            }}
          />
          <FormControl sx={{ minWidth: 200 }}>
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
          <Table sx={{ minWidth: 650 }} aria-label="Bảng người dùng">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tên đăng nhập</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Số điện thoại</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Vai trò</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    Không tìm thấy người dùng nào.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phoneNumber}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getRoleLabel(getUserRole(user))}
                        sx={{ 
                          backgroundColor: getRoleColor(getUserRole(user)), 
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Chỉnh sửa">
                        <IconButton onClick={() => handleEdit(user)} color="primary">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton onClick={() => handleDelete(user.id)} color="secondary">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xem chi tiết">
                        <Button variant="outlined" size="small" sx={{ ml: 1 }} onClick={() => handleViewUserDetail(user.id)}>
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
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Chỉnh sửa Người dùng</DialogTitle>
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
      <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="sm" fullWidth>
        <DialogTitle>Chi tiết Người dùng</DialogTitle>
        <DialogContent>
          {selectedUserDetail ? (
            <Box>
              <Typography variant="h6" gutterBottom>ID: {selectedUserDetail.id}</Typography>
              <Typography variant="h6" gutterBottom>Tên đăng nhập: {selectedUserDetail.username}</Typography>
              <Typography variant="h6" gutterBottom>Email: {selectedUserDetail.email}</Typography>
              <Typography variant="h6" gutterBottom>Số điện thoại: {selectedUserDetail.phoneNumber}</Typography>
              <Typography variant="h6" gutterBottom>Địa chỉ: {selectedUserDetail.address}</Typography>
              <Typography variant="h6" gutterBottom>Vai trò: {getRoleLabel(getUserRole(selectedUserDetail))}</Typography>
              <Typography variant="h6" gutterBottom>Ngày tạo: {new Date(selectedUserDetail.createdAt).toLocaleDateString()}</Typography>
              {selectedUserDetail.role === 'coach' && (
                <Box sx={{ mt: 3, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Thông tin Huấn luyện viên:</Typography>
                  <Typography variant="body1">Chuyên môn: {selectedUserDetail.expertise}</Typography>
                  <Typography variant="body1">Kinh nghiệm: {selectedUserDetail.experience}</Typography>
                  <Typography variant="body1">Giới thiệu: {selectedUserDetail.bio}</Typography>
                  {selectedUserDetail.assignedMembers && selectedUserDetail.assignedMembers.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Các thành viên được chỉ định:</Typography>
                      <ul>
                        {selectedUserDetail.assignedMembers.map(member => (
                          <li key={member.id}>{member.username} ({member.email})</li>
                        ))}
                      </ul>
                    </Box>
                  )}
                </Box>
              )}
              {selectedUserDetail.role === 'member' && (
                <Box sx={{ mt: 3, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Thông tin Thành viên:</Typography>
                  <Typography variant="body1">Số điếu hút mỗi ngày: {selectedUserDetail.cigarettesPerDay}</Typography>
                  <Typography variant="body1">Số năm hút: {selectedUserDetail.smokingYears}</Typography>
                  <Typography variant="body1">Lý do cai: {selectedUserDetail.reasonToQuit}</Typography>
                  {selectedUserDetail.assignedCoach && (
                    <Typography variant="body1">Huấn luyện viên được chỉ định: {selectedUserDetail.assignedCoach.username} ({selectedUserDetail.assignedCoach.email})</Typography>
                  )}
                  {selectedUserDetail.progress && selectedUserDetail.progress.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Tiến độ:</Typography>
                      <ul>
                        {selectedUserDetail.progress.map(p => (
                          <li key={p.date}>Ngày {new Date(p.date).toLocaleDateString()}: {p.cigarettesSmoked} điếu, Ghi chú: {p.note}</li>
                        ))}
                      </ul>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          ) : (
            <Typography>Đang tải chi tiết người dùng...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar thông báo */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminUserPage;