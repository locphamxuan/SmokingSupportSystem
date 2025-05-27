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
  Chip,
  Card,
  CardContent
} from "@mui/material";
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  People as PeopleIcon,
  WorkspacePremium as PremiumIcon,
  AdminPanelSettings as AdminIcon,
  SupportAgent as CoachIcon
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
    id: "",
    username: "",
    email: "",
    phoneNumber: "",
    address: "",
    role: "",
    isMember: false,
    createdAt: "",
    cigarettesPerDay: "",
    costPerPack: "",
    smokingFrequency: "",
    healthStatus: "",
    cigaretteType: "",
    dailyCigarettes: "",
    dailyFeeling: "",
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
      filtered = filtered.filter(user => user.isMember === true);
    } else if (roleFilter === "guest") {
      filtered = filtered.filter(user => getUserRole(user) === "guest" && user.isMember !== true);
    } else if (roleFilter === "coach") {
      filtered = filtered.filter(user => getUserRole(user) === "coach");
    } else if (roleFilter !== "all") {
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
      case "coach": 
        return { label: "Coaching", color: "info", icon: <CoachIcon /> };
      case "member": 
        return { label: "Khách hàng Premium", color: "warning", icon: <PremiumIcon /> };
      case "guest": 
        return { label: "Khách hàng", color: "default", icon: <PeopleIcon /> };
      default: 
        return { label: "Khách hàng", color: "default", icon: <PeopleIcon /> };
    }
  };

  const getStatistics = () => {
    const filteredUsers = users.filter(user => user.role !== 'admin');
    const coachCount = filteredUsers.filter(user => getUserRole(user) === "coach").length;
    const memberCount = filteredUsers.filter(user => getUserRole(user) === "member").length;
    const guestCount = filteredUsers.filter(user => getUserRole(user) === "guest").length;
    return { coachCount, memberCount, guestCount };
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      id: user.id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      address: user.address || "",
      role: user.role,
      isMember: user.isMember,
      createdAt: user.createdAt,
      cigarettesPerDay: user.cigarettesPerDay,
      costPerPack: user.costPerPack,
      smokingFrequency: user.smokingFrequency,
      healthStatus: user.healthStatus,
      cigaretteType: user.cigaretteType,
      dailyCigarettes: user.dailyCigarettes,
      dailyFeeling: user.dailyFeeling
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
      isMember: false,
      createdAt: "",
      cigarettesPerDay: "",
      costPerPack: "",
      smokingFrequency: "",
      healthStatus: "",
      cigaretteType: "",
      dailyCigarettes: "",
      dailyFeeling: "",
    });
  };

  const handleSave = async () => {
    try {
      await updateUser(selectedUser.userID, formData);
      setSnackbar({
        open: true,
        message: "Cập nhật người dùng thành công!",
        severity: "success",
      });
      fetchUsers();
      handleClose();
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
          message: "Xóa người dùng thành công!",
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const stats = getStatistics();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Quản lý người dùng
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats.coachCount}</Typography>
                  <Typography variant="body2">Huấn luyện viên</Typography>
                </Box>
                <CoachIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats.memberCount}</Typography>
                  <Typography variant="body2">Thành viên</Typography>
                </Box>
                <PremiumIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #9e9e9e 0%, #bdbdbd 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats.guestCount}</Typography>
                  <Typography variant="body2">Khách hàng</Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tìm kiếm theo tên hoặc email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={3}>
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
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Tên người dùng</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Số điện thoại</TableCell>
                <TableCell>Địa chỉ</TableCell>
                <TableCell>Vai trò</TableCell>
                <TableCell>Thành viên</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Số điếu/ngày</TableCell>
                <TableCell>Chi phí/gói</TableCell>
                <TableCell>Tần suất</TableCell>
                <TableCell>Tình trạng sức khỏe</TableCell>
                <TableCell>Loại thuốc lá</TableCell>
                <TableCell>Số điếu hôm nay</TableCell>
                <TableCell>Cảm nhận hôm nay</TableCell>
                <TableCell>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phoneNumber || "Chưa có"}</TableCell>
                  <TableCell>{user.address || "Chưa có"}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.isMember ? "Có" : "Không"}</TableCell>
                  <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleString() : ""}</TableCell>
                  <TableCell>{user.smokingStatus?.cigarettesPerDay ?? "Chưa có"}</TableCell>
                  <TableCell>{user.smokingStatus?.costPerPack ?? "Chưa có"}</TableCell>
                  <TableCell>{user.smokingStatus?.smokingFrequency ?? "Chưa có"}</TableCell>
                  <TableCell>{user.smokingStatus?.healthStatus ?? "Chưa có"}</TableCell>
                  <TableCell>{user.smokingStatus?.cigaretteType ?? "Chưa có"}</TableCell>
                  <TableCell>{user.smokingStatus?.dailyCigarettes ?? "Chưa có"}</TableCell>
                  <TableCell>{user.smokingStatus?.dailyFeeling ?? "Chưa có"}</TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleEdit(user)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(user.id)} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="username"
                label="Tên người dùng"
                value={formData.username}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="email"
                label="Email"
                value={formData.email}
                onChange={handleInputChange}
                fullWidth
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
                  <MenuItem value="coach">Coaching</MenuItem>
                  <MenuItem value="member">Khách hàng Premium</MenuItem>
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Hủy</Button>
          <Button onClick={handleSave} variant="contained">
            Lưu
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