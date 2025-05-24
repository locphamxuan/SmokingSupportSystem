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
    throw error.response?.data || { message: 'Đã xảy ra lỗi' };
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
    throw error.response?.data || { message: 'Đã xảy ra lỗi' };
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

// Profile related functions
export const getProfile = async () => {
  try {
    const response = await axios.get(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể lấy thông tin người dùng' };
  }
};

export const updateProfile = async (userData) => {
  try {
    const response = await axios.put(`${API_URL}/profile`, userData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể cập nhật thông tin' };
  }
};

export const updateSmokingStatus = async (smokingData) => {
  try {
    const response = await axios.put(`${API_URL}/smoking-status`, smokingData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể cập nhật tình trạng hút thuốc' };
  }
};

export const createQuitPlan = async (planData) => {
  try {
    const response = await axios.post(`${API_URL}/quit-plan`, planData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể tạo kế hoạch cai thuốc' };
  }
};

export const updateQuitPlan = async (planData) => {
  try {
    const response = await axios.put(`${API_URL}/quit-plan`, planData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể cập nhật kế hoạch cai thuốc' };
  }
};

export const updateQuitPlanProgress = async (progressData) => {
  try {
    const response = await axios.put(`${API_URL}/quit-plan/progress`, progressData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể cập nhật tiến độ' };
  }
};

// Admin functions
export const getAllUsers = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/admin/users', {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Đã xảy ra lỗi' };
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await axios.put(`http://localhost:5000/api/admin/user/${id}`, userData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Đã xảy ra lỗi' };
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await axios.delete(`http://localhost:5000/api/admin/user/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Đã xảy ra lỗi' };
  }
};

export const upgradeToAdmin = async (userId) => {
  try {
    const response = await axios.put(`${API_URL}/upgrade-admin`, { userId }, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Không thể nâng cấp tài khoản lên admin' };
  }
};