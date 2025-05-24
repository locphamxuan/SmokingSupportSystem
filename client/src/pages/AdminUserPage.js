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
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const AdminUserPage = () => {
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [editData, setEditData] = useState({});
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
    await updateUser(editUser.id, editData);
    setEditUser(null);
    fetchUsers();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure want to delete this user?")) {
      await deleteUser(id);
      fetchUsers();
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
    <div style={{ padding: '20px' }}>
      <h2>Quản lý tài khoản người dùng</h2>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Tên đăng nhập</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Vai trò</TableCell>
            <TableCell>Số điện thoại</TableCell>
            <TableCell>Địa chỉ</TableCell>
            <TableCell>Ngày tạo</TableCell>
            <TableCell>Số điếu thuốc/ngày</TableCell>
            <TableCell>Giá hộp/gói</TableCell>
            <TableCell>Tần suất hút thuốc</TableCell>
            <TableCell>Tình trạng sức khỏe</TableCell>
            <TableCell>Hành động</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id || user.Id}>
              <TableCell>{user.username || user.Username}</TableCell>
              <TableCell>{user.email || user.Email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>{user.phoneNumber}</TableCell>
              <TableCell>{user.address}</TableCell>
              <TableCell>
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleString()
                  : ""}
              </TableCell>
              <TableCell>{user.cigarettesPerDay ?? ''}</TableCell>
              <TableCell>{user.costPerPack ?? ''}</TableCell>
              <TableCell>{user.smokingFrequency ?? ''}</TableCell>
              <TableCell>{user.healthStatus ?? ''}</TableCell>
              <TableCell>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => handleEdit(user)}
                  style={{ marginRight: '8px' }}
                >
                  Cập nhật
                </Button>
                <Button 
                  variant="contained" 
                  color="error" 
                  onClick={() => handleDelete(user.id)}
                >
                  Xóa
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editUser} onClose={() => setEditUser(null)}>
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
          <TextField
            margin="normal"
            label="Vai trò"
            name="role"
            value={editData.role || ""}
            onChange={handleEditChange}
            fullWidth
            disabled
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
            label="Số điếu/ngày"
            name="cigarettesPerDay"
            type="number"
            value={editData.cigarettesPerDay || ""}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            margin="normal"
            label="Giá hộp/gói"
            name="costPerPack"
            type="number"
            value={editData.costPerPack || ""}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            margin="normal"
            label="Tần suất hút thuốc"
            name="smokingFrequency"
            value={editData.smokingFrequency || ""}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            margin="normal"
            label="Tình trạng sức khỏe"
            name="healthStatus"
            value={editData.healthStatus || ""}
            onChange={handleEditChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)}>Hủy</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminUserPage;
