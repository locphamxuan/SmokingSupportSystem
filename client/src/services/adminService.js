import axios from 'axios';

const API_URL = 'http://localhost:5000/api/admin';

export const getUsers = async () => {
  const res = await axios.get(`${API_URL}/users`);
  return res.data;
};

export const updateUser = async (id, data) => {
  const res = await axios.put(`${API_URL}/user/${id}`, data);
  return res.data;
};

export const deleteUser = async (id) => {
  const res = await axios.delete(`${API_URL}/user/${id}`);
  return res.data;
};