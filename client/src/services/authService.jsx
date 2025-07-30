import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Đã xảy ra lỗi" };
  }
};

export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Đã xảy ra lỗi" };
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) return JSON.parse(userStr);
  return null;
};

export const getToken = () => {
  return localStorage.getItem("token");
};

// Profile related functions
export const getProfile = async () => {
  const token = getToken();
  const response = await axios.get(`${API_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateProfile = async (userData) => {
  const token = getToken();
  const response = await axios.put(`${API_URL}/auth/profile`, userData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Smoking profile functions
export const getSmokingProfile = async () => {
  const token = getToken();
  const response = await axios.get(`${API_URL}/auth/smoking-profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateSmokingProfile = async (profileData) => {
  const token = getToken();
  const response = await axios.put(
    `${API_URL}/auth/smoking-profile`,
    profileData,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.data;
};

// Quit plan functions
export const createQuitPlan = async (planData) => {
  const token = getToken();
  const response = await axios.post(`${API_URL}/auth/quit-plan`, planData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateQuitPlan = async (planId, planData) => {
  const token = getToken();
  const response = await axios.put(
    `${API_URL}/auth/quit-plan/${planId}`,
    planData,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.data;
};

export const getQuitPlans = async () => {
  const token = getToken();
  const response = await axios.get(`${API_URL}/auth/quit-plans`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Progress tracking functions
export const updateProgress = async (progressData) => {
  const token = getToken();
  const response = await axios.post(`${API_URL}/auth/progress`, progressData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getProgress = async () => {
  const token = getToken();
  const response = await axios.get(`${API_URL}/auth/progress`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Statistics functions
export const getStatistics = async () => {
  const token = getToken();
  const response = await axios.get(`${API_URL}/auth/statistics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Badge functions
export const getUserBadges = async () => {
  const token = getToken();
  const response = await axios.get(`${API_URL}/auth/badges`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getAllBadges = async () => {
  const token = getToken();
  const response = await axios.get(`${API_URL}/auth/all-badges`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Blog functions
export const createBlog = async (blogData) => {
  const token = getToken();
  const response = await axios.post(`${API_URL}/blogs`, blogData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getBlogs = async () => {
  const response = await axios.get(`${API_URL}/blogs`);
  return response.data;
};

// Comment functions
export const addComment = async (blogId, commentData) => {
  const token = getToken();
  const response = await axios.post(
    `${API_URL}/blogs/${blogId}/comments`,
    commentData,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.data;
};

// Notification functions
export const getNotifications = async () => {
  const token = getToken();
  const response = await axios.get(`${API_URL}/auth/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const token = getToken();
  const response = await axios.put(
    `${API_URL}/auth/notifications/${notificationId}/read`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.data;
};

// Feedback functions
export const submitFeedback = async (feedbackData) => {
  const token = getToken();
  const response = await axios.post(`${API_URL}/auth/feedback`, feedbackData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Ranking functions
export const getRankings = async () => {
  const response = await axios.get(`${API_URL}/rankings`);
  return response.data;
};

// Admin functions
export const getAllUsers = async () => {
  const token = getToken();
  const response = await axios.get(`${API_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateUser = async (id, userData) => {
  const token = getToken();
  const response = await axios.put(`${API_URL}/admin/users/${id}`, userData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteUser = async (id) => {
  const token = getToken();
  const response = await axios.delete(`${API_URL}/admin/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const upgradeToMember = async () => {
  const token = getToken();
  const response = await axios.put(
    `${API_URL}/auth/upgrade-member`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.data;
};

// Post functions
export const createPost = async (postData) => {
  const token = getToken();
  const response = await axios.post(`${API_URL}/auth/posts`, postData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getUserPosts = async () => {
  const token = getToken();
  const response = await axios.get(`${API_URL}/auth/my-posts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
