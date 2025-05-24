//quản lý user cho admin

import React, { useEffect, useState } from "react";
import { getUsers, updateUser, deleteUser } from "../services/adminService";
import { upgradeToAdmin } from "../services/authService";
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

  const handleUpgradeToAdmin = async (userId) => {
    if (window.confirm("Bạn có chắc muốn nâng cấp người dùng này lên admin?")) {
      try {
        await upgradeToAdmin(userId);
        fetchUsers();
        alert("Nâng cấp thành công!");
      } catch (error) {
        alert("Không thể nâng cấp người dùng: " + error.message);
      }
    }
  };

  return (
    <div>
      <h2>Quản lý tài khoản</h2>
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
              <TableCell>
                <Button onClick={() => handleEdit(user)}>Cập nhập</Button>
                <Button color="error" onClick={() => handleDelete(user._id)}>
                  Xóa
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editUser} onClose={() => setEditUser(null)}>
        <DialogTitle>Update users</DialogTitle>
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
          <TextField
            margin="normal"
            label="Role"
            name="role"
            value={editData.role || ""}
            onChange={handleEditChange}
            fullWidth
          />
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
          <TextField
            margin="normal"
            label="Cigarettes/Day"
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
          />
          <TextField
            margin="normal"
            label="Cost/Pack"
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
          />
          <TextField
            margin="normal"
            label="Frequency"
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
          />
          <TextField
            margin="normal"
            label="Health Status"
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminUserPage;
