//quản lý user cho admin

import React, { useEffect, useState } from 'react';
import { getUsers, updateUser, deleteUser } from '../services/adminService';
import { Button, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';

const AdminUserPage = () => {
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const data = await getUsers();
    setUsers(data);
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
    if (window.confirm('Bạn có chắc muốn xóa user này?')) {
      await deleteUser(id);
      fetchUsers();
    }
  };

  return (
    <div>
      <h2>Quản lý người dùng</h2>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Tên</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Hành động</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map(user => (
            <TableRow key={user._id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Button onClick={() => handleEdit(user)}>Sửa</Button>
                <Button color="error" onClick={() => handleDelete(user._id)}>Xóa</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editUser} onClose={() => setEditUser(null)}>
        <DialogTitle>Cập nhật user</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            label="Tên"
            name="username"
            value={editData.username || ''}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            margin="normal"
            label="Email"
            name="email"
            value={editData.email || ''}
            onChange={handleEditChange}
            fullWidth
          />
          <TextField
            margin="normal"
            label="Role"
            name="role"
            value={editData.role || ''}
            onChange={handleEditChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)}>Hủy</Button>
          <Button onClick={handleEditSave} variant="contained">Lưu</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminUserPage;