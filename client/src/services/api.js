import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
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

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (profileData) => api.put('/auth/profile', profileData)
};

// Smoking Profile API
export const smokingProfileAPI = {
    createProfile: (profileData) => api.post('/smoking-profiles', profileData),
    getProfile: () => api.get('/smoking-profiles')
};

// Quit Plan API
export const quitPlanAPI = {
    createPlan: (planData) => api.post('/quit-plans', planData),
    getPlans: () => api.get('/quit-plans')
};

// Progress API
export const progressAPI = {
    recordProgress: (progressData) => api.post('/progress', progressData),
    getProgress: () => api.get('/progress')
};

// Booking API
export const bookingAPI = {
    createBooking: (bookingData) => api.post('/bookings', bookingData),
    getBookings: () => api.get('/bookings')
};

// Message API
export const messageAPI = {
    sendMessage: (messageData) => api.post('/messages', messageData),
    getMessages: (coachId) => api.get(`/messages/${coachId}`)
};

// Admin API
export const adminAPI = {
    getAllUsers: () => api.get('/admin/users'),
    getAllCoaches: () => api.get('/admin/coaches')
};

export default api; 