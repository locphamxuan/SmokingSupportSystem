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
    // Kiểm tra nếu user có IsMember = 1 thì coi là member
    if (user.isMember === 1 || user.isMember === true) {
      return "member";
    }
    
    // Ưu tiên role từ database
    if (user.role) {
      return user.role.toLowerCase();
    }
    
    // Fallback logic cho các trường hợp cũ
    if (user.isAdmin === 1) return "admin";
    return "guest";
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin": return "#f44336";
      case "coach": return "#2196f3";
      case "member": return "#ff9800";
      case "guest": return "#9e9e9e";
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

    // Bỏ user admin khỏi danh sách
    filtered = filtered.filter(user => user.role !== 'admin');

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
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
      console.log('Fetching users...');
      const data = await getUsers();
      console.log('Users data received:', data);
      
      if (!data || !Array.isArray(data)) {
        console.error('Invalid data format received:', data);
        setSnackbar({
          open: true,
          message: "Dữ liệu người dùng không hợp lệ",
          severity: "error",
        });
        return;
      }

      // Sắp xếp danh sách theo ID tăng dần
      const sortedData = data.sort((a, b) => a.id - b.id);
      console.log('Sorted users data:', sortedData);
      setUsers(sortedData);
    } catch (error) {
      console.error("Lỗi khi tải danh sách người dùng:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = "Lỗi khi tải danh sách người dùng";
      
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
      role: user.role || "guest",
      isMember: user.isMember || false
    });
    setOpen(true);
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
      console.log('=== FRONTEND UPDATE REQUEST ===');
      console.log('Selected user:', selectedUser);
      console.log('Form data to send:', formData);
      
      // Validate dữ liệu trước khi gửi
      if (!formData.username || !formData.email) {
        setSnackbar({
          open: true,
          message: "Vui lòng điền đầy đủ tên người dùng và email!",
          severity: "error",
        });
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setSnackbar({
          open: true,
          message: "Định dạng email không hợp lệ!",
          severity: "error",
        });
        return;
      }
      
      console.log('Sending update request for user ID:', selectedUser.id);
      
      // Sử dụng user.id thay vì userID
      const result = await updateUser(selectedUser.id, formData);
      console.log('=== UPDATE SUCCESS ===');
      console.log('Update result:', result);
      
      // Hiển thị thông báo thành công
      setSnackbar({
        open: true,
        message: "Thông tin đã được thay đổi và lưu thành công!",
        severity: "success",
      });
      
      // Refresh danh sách users để hiển thị thông tin mới
      console.log('Refreshing user list...');
      await fetchUsers();
      
      // Đóng dialog
      handleClose();
      
    } catch (error) {
      console.error("=== FRONTEND UPDATE ERROR ===");
      console.error("Error object:", error);
      
      let errorMessage = "Lỗi khi cập nhật thông tin người dùng";
      
      if (error.response) {
        // Server responded with error status
        console.error("Error response:", error.response);
        console.error("Error status:", error.response.status);
        console.error("Error data:", error.response.data);
        
        // Kiểm tra nếu server trả về success nhưng axios coi là lỗi
        if (error.response.status === 200 || error.response.status === 201) {
          console.log('Success status detected, treating as success');
          setSnackbar({
            open: true,
            message: "Thông tin đã được thay đổi và lưu thành công!",
            severity: "success",
          });
          await fetchUsers();
          handleClose();
          return;
        }
        
        // Lấy thông báo lỗi từ server
        if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Lỗi server (${error.response.status}): ${error.response.statusText}`;
        }
        
      } else if (error.request) {
        // Network error
        console.error("Network error:", error.request);
        errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.";
      } else {
        // Other error
        console.error("Error:", error.message);
        errorMessage = error.message || "Đã xảy ra lỗi không xác định";
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
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
          message: "Xóa người dùng thành công!",
          severity: "success",
        });
        fetchUsers();
      } catch (error) {
        console.error("Lỗi khi xóa người dùng:", error);
        setSnackbar({
          open: true,
          message: "Lỗi khi xóa người dùng: " + (error.response?.data?.message || error.message),
          severity: "error",
        });
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleViewUserDetail = async (userId) => {
    try {
      console.log('Fetching user detail for ID:', userId);
      
      // Gọi API để lấy thông tin chi tiết từ server
      const userDetail = await getUserDetail(userId);
      
      console.log('User detail received:', userDetail);
      setSelectedUserDetail(userDetail);
      setDetailOpen(true);
    } catch (error) {
      console.error("Error fetching user detail:", error);
      setSnackbar({
        open: true,
        message: "Lỗi khi tải thông tin chi tiết người dùng",
        severity: "error",
      });
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedUserDetail(null);
  };

  const stats = getStatistics();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#f5f5f5' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
            <DashboardIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              Quản lý người dùng
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Hệ thống hỗ trợ cai thuốc lá
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {stats.totalUsers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng người dùng
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: '#1976d2' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#e8f5e8' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                    {stats.coachCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Huấn luyện viên
                  </Typography>
                </Box>
                <CoachIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff3e0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                    {stats.memberCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Thành viên
                  </Typography>
                </Box>
                <PremiumIcon sx={{ fontSize: 40, color: '#f57c00' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f3e5f5' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#7b1fa2' }}>
                    {stats.guestCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Khách hàng
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: '#7b1fa2' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Tìm kiếm và lọc
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Tìm kiếm theo tên hoặc email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Lọc theo vai trò</InputLabel>
              <Select
                value={roleFilter}
                label="Lọc theo vai trò"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="coach">Huấn luyện viên</MenuItem>
                <MenuItem value="member">Thành viên</MenuItem>
                <MenuItem value="guest">Khách hàng</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <Paper>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Danh sách người dùng ({filteredUsers.length})
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Người dùng</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Số điện thoại</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Địa chỉ</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Vai trò</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ngày tạo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} sx={{ '&:hover': { bgcolor: '#f9f9f9' } }}>
                  <TableCell>
                    <Chip 
                      label={user.id} 
                      size="small" 
                      variant="outlined" 
                      onClick={() => handleViewUserDetail(user.id)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: '#1976d2',
                          color: 'white'
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          mr: 2, 
                          bgcolor: getRoleColor(user.role),
                          width: 32,
                          height: 32
                        }}
                      >
                        {user.username?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {user.username}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phoneNumber || "Chưa có"}</TableCell>
                  <TableCell>{user.address || "Chưa có"}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getRoleLabel(getUserRole(user))} 
                      sx={{ 
                        bgcolor: getRoleColor(getUserRole(user)),
                        color: 'white',
                        fontWeight: 600
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton 
                          color="primary" 
                          onClick={() => handleEdit(user)} 
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Xóa">
                        <IconButton 
                          color="error" 
                          onClick={() => handleDelete(user.id)} 
                          size="small"
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
        </TableContainer>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EditIcon sx={{ mr: 1 }} />
            Chỉnh sửa thông tin người dùng
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="username"
                label="Tên người dùng"
                value={formData.username}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="email"
                label="Email"
                value={formData.email}
                onChange={handleInputChange}
                fullWidth
                required
                type="email"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Vai trò</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  label="Vai trò"
                  onChange={handleInputChange}
                >
                  <MenuItem value="admin">Quản trị viên</MenuItem>
                  <MenuItem value="coach">Huấn luyện viên</MenuItem>
                  <MenuItem value="member">Thành viên</MenuItem>
                  <MenuItem value="guest">Khách hàng</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="phoneNumber"
                label="Số điện thoại"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Địa chỉ"
                value={formData.address}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Loại thành viên</InputLabel>
                <Select
                  name="isMember"
                  value={formData.isMember}
                  label="Loại thành viên"
                  onChange={handleInputChange}
                >
                  <MenuItem value={false}>Thành viên thường</MenuItem>
                  <MenuItem value={true}>Thành viên Premium</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} variant="outlined">
            Hủy
          </Button>
          <Button onClick={handleSave} variant="contained">
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#2196f3', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PeopleIcon sx={{ mr: 1 }} />
            Thông tin chi tiết người dùng
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedUserDetail && (
            <Grid container spacing={3}>
              {/* Thông tin cơ bản */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600 }}>
                  Thông tin cơ bản
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">ID:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedUserDetail.id}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Tên người dùng:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedUserDetail.username}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Email:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedUserDetail.email}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Số điện thoại:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedUserDetail.phoneNumber || "Chưa có"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Địa chỉ:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedUserDetail.address || "Chưa có"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Vai trò:</Typography>
                      <Chip 
                        label={getRoleLabel(getUserRole(selectedUserDetail))} 
                        sx={{ 
                          bgcolor: getRoleColor(getUserRole(selectedUserDetail)),
                          color: 'white',
                          fontWeight: 600
                        }}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Tình trạng hút thuốc */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600 }}>
                  Tình trạng hút thuốc
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#fff3e0' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Số điếu thuốc/ngày:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedUserDetail.smokingStatus.cigarettesPerDay || 0} điếu
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Giá mỗi bao:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedUserDetail.smokingStatus.costPerPack || 0} VNĐ
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Tần suất hút:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedUserDetail.smokingStatus.smokingFrequency || "Chưa cập nhật"}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Tình trạng sức khỏe:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedUserDetail.smokingStatus.healthStatus || "Chưa cập nhật"}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Loại thuốc:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedUserDetail.smokingStatus.cigaretteType || "Chưa cập nhật"}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Lý do muốn cai:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedUserDetail.smokingStatus.quitReason || "Chưa cập nhật"}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Nhật ký hôm nay */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600 }}>
                  Nhật ký hôm nay
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#e8f5e8' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Số điếu đã hút hôm nay:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedUserDetail.smokingStatus.dailyLog?.cigarettes || 0} điếu
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Cảm giác hôm nay:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedUserDetail.smokingStatus.dailyLog?.feeling || "Chưa ghi nhận"}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Thông tin tài khoản */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600 }}>
                  Thông tin tài khoản
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#f3e5f5' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Ngày tạo tài khoản:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {selectedUserDetail.createdAt ? new Date(selectedUserDetail.createdAt).toLocaleDateString('vi-VN') : "N/A"}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Loại thành viên:</Typography>
                      <Chip 
                        label={selectedUserDetail.isMember ? "Premium" : "Thường"} 
                        color={selectedUserDetail.isMember ? "warning" : "default"}
                        variant={selectedUserDetail.isMember ? "filled" : "outlined"}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDetail} variant="outlined">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
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