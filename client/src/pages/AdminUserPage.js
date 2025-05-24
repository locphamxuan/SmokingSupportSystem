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
  IconButton,
  Tooltip,
} from "@mui/material";
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon 
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const AdminUserPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [editData, setEditData] = useState({});
  const [roleFilter, setRoleFilter] = useState('all');
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
      setUsers(data);
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

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Quản lý tài khoản người dùng
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Lọc theo vai trò</InputLabel>
          <Select
            value={roleFilter}
            label="Lọc theo vai trò"
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="all">Tất cả người dùng</MenuItem>
            <MenuItem value="user">Người dùng thường</MenuItem>
            <MenuItem value="premium">Người dùng Premium</MenuItem>
          </Select>
        </FormControl>
        
        <Typography variant="body1" color="textSecondary">
          Tổng cộng: {filteredUsers.length} tài khoản
        </Typography>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Tên đăng nhập</strong></TableCell>
            <TableCell><strong>Email</strong></TableCell>
            <TableCell><strong>Vai trò</strong></TableCell>
            <TableCell><strong>Số điện thoại</strong></TableCell>
            <TableCell><strong>Địa chỉ</strong></TableCell>
            <TableCell><strong>Ngày tạo</strong></TableCell>
            <TableCell><strong>Số điếu thuốc/ngày</strong></TableCell>
            <TableCell><strong>Giá hộp/gói</strong></TableCell>
            <TableCell><strong>Tần suất hút thuốc</strong></TableCell>
            <TableCell><strong>Tình trạng sức khỏe</strong></TableCell>
            <TableCell><strong>Hành động</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user._id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Chip 
                  label={user.role === 'premium' ? 'Premium' : 'Người dùng'} 
                  color={getRoleColor(user.role)}
                  size="small"
                />
              </TableCell>
              <TableCell>{user.phoneNumber}</TableCell>
              <TableCell>{user.address}</TableCell>
              <TableCell>
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                  : ""}
              </TableCell>
              <TableCell>{user.smokingStatus?.cigarettesPerDay ?? ''}</TableCell>
              <TableCell>{user.smokingStatus?.costPerPack ?? ''}</TableCell>
              <TableCell>{user.smokingStatus?.smokingFrequency ?? ''}</TableCell>
              <TableCell>{user.smokingStatus?.healthStatus ?? ''}</TableCell>
                            <TableCell>                <Box sx={{ display: 'flex', gap: 1 }}>                  <Tooltip title="Cập nhật thông tin">                    <IconButton                       onClick={() => handleEdit(user)}                      color="primary"                      size="small"                      sx={{                         bgcolor: 'primary.main',                        color: 'white',                        '&:hover': {                          bgcolor: 'primary.dark',                          transform: 'scale(1.1)'                        },                        transition: 'all 0.2s'                      }}                    >                      <EditIcon fontSize="small" />                    </IconButton>                  </Tooltip>                                    <Tooltip title="Xóa tài khoản">                    <IconButton                       onClick={() => handleDelete(user._id)}                      color="error"                      size="small"                      sx={{                         bgcolor: 'error.main',                        color: 'white',                        '&:hover': {                          bgcolor: 'error.dark',                          transform: 'scale(1.1)'                        },                        transition: 'all 0.2s'                      }}                    >                      <DeleteIcon fontSize="small" />                    </IconButton>                  </Tooltip>                </Box>              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filteredUsers.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            Không có tài khoản người dùng nào
          </Typography>
        </Box>
      )}

      <Dialog open={!!editUser} onClose={() => setEditUser(null)} maxWidth="md" fullWidth>
        <DialogTitle>Cập nhật thông tin người dùng</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            label="Tên đăng nhập"
            name="username"
            value={editData.username || ""}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            margin="normal"
            label="Email"
            name="email"
            value={editData.email || ""}
            onChange={handleEditChange}
            fullWidth
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Vai trò</InputLabel>
            <Select
              name="role"
              value={editData.role || "user"}
              label="Vai trò"
              onChange={handleEditChange}
            >
              <MenuItem value="user">Người dùng thường</MenuItem>
              <MenuItem value="premium">Người dùng Premium</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            label="Số điện thoại"
            name="phoneNumber"
            value={editData.phoneNumber || ""}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            margin="normal"
            label="Địa chỉ"
            name="address"
            value={editData.address || ""}
            onChange={handleEditChange}
            fullWidth
          />
          
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
            Thông tin hút thuốc
          </Typography>
          
          <TextField
            margin="normal"
            label="Số điếu thuốc/ngày"
            type="number"
            value={editData.smokingStatus?.cigarettesPerDay || ""}
            onChange={(e) => setEditData({
              ...editData,
              smokingStatus: {
                ...editData.smokingStatus,
                cigarettesPerDay: e.target.value
              }
            })}
            fullWidth
          />
          <TextField
            margin="normal"
            label="Giá tiền/gói (VNĐ)"
            type="number"
            value={editData.smokingStatus?.costPerPack || ""}
            onChange={(e) => setEditData({
              ...editData,
              smokingStatus: {
                ...editData.smokingStatus,
                costPerPack: e.target.value
              }
            })}
            fullWidth
          />
          <TextField
            margin="normal"
            label="Tần suất hút thuốc"
            value={editData.smokingStatus?.smokingFrequency || ""}
            onChange={(e) => setEditData({
              ...editData,
              smokingStatus: {
                ...editData.smokingStatus,
                smokingFrequency: e.target.value
              }
            })}
            fullWidth
          />
          <TextField
            margin="normal"
            label="Tình trạng sức khỏe"
            value={editData.smokingStatus?.healthStatus || ""}
            onChange={(e) => setEditData({
              ...editData,
              smokingStatus: {
                ...editData.smokingStatus,
                healthStatus: e.target.value
              }
            })}
            fullWidth
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)}>Hủy</Button>
          <Button onClick={handleEditSave} variant="contained">
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminUserPage;
