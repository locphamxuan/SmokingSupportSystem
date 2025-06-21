const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Tạo một instance Axios với cấu hình mặc định
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Thêm một interceptor vào Axios để tự động thêm token xác thực vào tiêu đề yêu cầu
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Các hàm tiện ích để gọi API (API Service)
const apiService = {
    // Xác thực người dùng
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    
    // Hồ sơ người dùng
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data) => api.put('/users/profile', data),
    
    // Trạng thái hút thuốc
    updateSmokingStatus: (status) => api.put('/users/smoking-status', status),
    
    // Kế hoạch cai thuốc
    createQuitPlan: (plan) => api.post('/auth/quit-plan', plan),
    getQuitPlan: () => api.get('/auth/quit-plan'),
    updateQuitPlan: (planId, plan) => api.put(`/auth/quit-plan/${planId}`, plan),
    getSuggestedQuitPlans: () => api.get('/auth/quit-plan/suggested'),
    
    // Tiến độ
    addProgress: (progress) => api.post('/progress', progress),
    getProgress: () => api.get('/progress'),
    
    // Huấn luyện viên
    getCoaches: () => api.get('/coaches'),
    getCoachSuggestions: (coachId) => api.get(`/coaches/${coachId}/suggestions`),
    
 
    // Tin nhắn
    sendMessage: (data) => api.post('/messages', data),
    getMessages: (conversationId) => api.get(`/messages/${conversationId}`),

    // Hồ sơ hút thuốc
    createSmokingProfile: (profile) => api.post('/smoking-profiles', profile),
    getSmokingProfile: () => api.get('/smoking-profiles'),

    // Quản trị viên
    getAllUsers: () => api.get('/admin/users'),
    getAllCoaches: () => api.get('/admin/coaches'),

    // Đặt lịch hẹn
    createBooking: (data) => api.post('/booking', data),
    getBookings: () => api.get('/booking'),

    // Huy hiệu
    getUserBadges: () => api.get('/auth/badges'),
};

module.exports = apiService; 