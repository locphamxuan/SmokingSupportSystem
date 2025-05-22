import axios from 'axios';

const API_URL = 'http://localhost:5000/api/admin';

export const getUsers = async () => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateUser = async (id, data) => {
  const token = localStorage.getItem('token');
  const res = await axios.put(`${API_URL}/user/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const deleteUser = async (id) => {
  const token = localStorage.getItem('token');
  const res = await axios.delete(`${API_URL}/user/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};