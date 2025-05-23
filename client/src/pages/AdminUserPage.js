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
      setUsers(data);
    } catch (error) {
      alert("Cannot load user list!");
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
    await updateUser(editUser._id, editData);
    setEditUser(null);
    fetchUsers();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure want to delete this user?")) {
      await deleteUser(id);
      fetchUsers();
    }
  };

  return (
    <div>
      <h2>Quản lý tài khoản</h2>
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
            <TableRow key={user._id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>{user.phoneNumber}</TableCell>
              <TableCell>{user.address}</TableCell>
              <TableCell>
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleString()
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
            label="Name"
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
            label="Phone"
            name="phoneNumber"
            value={editData.phoneNumber || ""}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            margin="normal"
            label="Address"
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
