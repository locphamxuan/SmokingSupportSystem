import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getToken = () => {
  return localStorage.getItem('token');
};

export const getUsers = async () => {
  const token = getToken();
  const response = await axios.get(`${API_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateUser = async (id, userData) => {
  const token = getToken();
  const response = await axios.put(`${API_URL}/admin/user/${id}`, userData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteUser = async (id) => {
  const token = getToken();
  const response = await axios.delete(`${API_URL}/admin/user/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getStatistics = async () => {
  const token = getToken();
  const response = await axios.get(`${API_URL}/admin/statistics`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getFeedbacks = async () => {
  const token = getToken();
  const response = await axios.get(`${API_URL}/admin/feedbacks`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const getBlogs = async () => {
  const token = getToken();
  const response = await axios.get(`${API_URL}/admin/blogs`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateBlog = async (id, blogData) => {
  const token = getToken();
  const response = await axios.put(`${API_URL}/admin/blogs/${id}`, blogData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteBlog = async (id) => {
  const token = getToken();
  const response = await axios.delete(`${API_URL}/admin/blogs/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
