//quản lý user cho admin

import React, { useEffect, useState } from 'react';
import { getUsers, updateUser, deleteUser } from '../services/adminService';
import { Button, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AdminUserPage = () => {
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [editData, setEditData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      navigate('/'); // chuyển về trang chủ nếu không phải admin
    } else {
      fetchUsers();
    }
    // eslint-disable-next-line
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      alert('Cannot load user list!');
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
    if (window.confirm('Are you sure want to delete this user?')) {
      await deleteUser(id);
      fetchUsers();
    }
  };

  return (
    <div>
      <h2>Mangage Users</h2>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map(user => (
            <TableRow key={user._id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Button onClick={() => handleEdit(user)}>Edit</Button>
                <Button color="error" onClick={() => handleDelete(user._id)}>Delete</Button>
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
          <Button onClick={() => setEditUser(null)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AdminUserPage;