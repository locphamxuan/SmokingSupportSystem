import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getToken = () => {
  return localStorage.getItem('token');
};

export const getUsers = async () => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Fetching users with token:', token.substring(0, 10) + '...');
    
    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Users API response:', response.data);
    
    if (!response.data) {
      throw new Error('No data received from server');
    }

    return response.data;
  } catch (error) {
    console.error('Error in getUsers:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
    }
    throw error;
  }
};

export const getUserDetail = async (id) => {
  const token = getToken();
  const response = await axios.get(`${API_URL}/admin/user/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateUser = async (id, userData) => {
  const token = getToken();
  console.log('Sending update request for user:', id, 'with data:', userData);
  
  try {
    const response = await axios.put(`${API_URL}/admin/user/${id}`, userData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Update response status:', response.status);
    console.log('Update response data:', response.data);
    
    // Kiểm tra response format
    if (response.data && response.data.success) {
      return response.data.data; // Trả về user data
    } else if (response.data && response.data.id) {
      return response.data; // Format cũ
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Update request failed:', error);
    console.error('Error response:', error.response);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    throw error;
  }
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
