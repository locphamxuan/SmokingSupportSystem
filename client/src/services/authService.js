import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const getAllUsers = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/admin/users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await axios.put(`http://localhost:5000/api/admin/user/${id}`, userData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await axios.delete(`http://localhost:5000/api/admin/user/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};