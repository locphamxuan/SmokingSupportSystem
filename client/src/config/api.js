export const API_BASE_URL = 'http://localhost:3001/api';

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    profile: `${API_BASE_URL}/auth/profile`,
    upgradeMember: `${API_BASE_URL}/auth/upgrade-member`,
    smokingStatus: `${API_BASE_URL}/auth/smoking-status`,
    quitPlan: `${API_BASE_URL}/auth/quit-plan`,
    progress: `${API_BASE_URL}/auth/progress`,
  },
  coach: {
    login: `${API_BASE_URL}/coach/login`,
  },
  admin: {
    users: `${API_BASE_URL}/admin/users`,
    user: (id) => `${API_BASE_URL}/admin/user/${id}`,
  }
}; 