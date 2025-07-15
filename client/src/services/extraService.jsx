const API_BASE = '/api/auth';

// Helper to get token
function getToken() {
  return localStorage.getItem('token');
}

// User Statistics
export async function getUserStatistics() {
  const res = await fetch(`${API_BASE}/statistics`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (!res.ok) throw new Error('Failed to fetch statistics');
  return res.json();
}

// Notifications
export async function getUserNotifications() {
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}
export async function markNotificationAsRead(notificationId) {
  const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (!res.ok) throw new Error('Failed to mark notification as read');
  return res.json();
}

// Reports
export async function submitReport(content) {
  const res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({ content })
  });
  if (!res.ok) throw new Error('Failed to submit report');
  return res.json();
}

// Rankings
export async function getRankings() {
  const res = await fetch(`${API_BASE}/rankings`);
  if (!res.ok) throw new Error('Failed to fetch rankings');
  return res.json();
}

// Daily Log
export async function getDailyLog() {
  const res = await fetch(`${API_BASE}/daily-log`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (!res.ok) throw new Error('Failed to fetch daily log');
  return res.json();
}

export async function addDailyLog({ cigarettes, feeling, logDate, planId, suggestedPlanId, coachSuggestedPlanId }) {
  console.log('🚀 [addDailyLog] ===================');
  console.log('🚀 [addDailyLog] Input parameters:', { cigarettes, feeling, logDate, planId, suggestedPlanId });
  console.log('🚀 [addDailyLog] cigarettes type:', typeof cigarettes, 'value:', cigarettes);
  
  const payload = { 
    cigarettes, 
    feeling, 
    logDate 
  };
  
  // Thêm planId hoặc suggestedPlanId nếu có
  if (planId) {
    payload.planId = planId;
  }
  if (suggestedPlanId) {
    payload.suggestedPlanId = suggestedPlanId;
  }
  if (coachSuggestedPlanId) {
    payload.coachSuggestedPlanId = coachSuggestedPlanId;
  }

  console.log('📦 [addDailyLog] Final payload:', payload);
  console.log('📦 [addDailyLog] Payload JSON:', JSON.stringify(payload));
  
  const token = getToken();
  console.log('🔑 [addDailyLog] Token exists:', !!token);
  console.log('🔑 [addDailyLog] Token length:', token ? token.length : 0);

  const res = await fetch(`${API_BASE}/daily-log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  
  console.log('📡 [addDailyLog] Response status:', res.status);
  console.log('📡 [addDailyLog] Response OK:', res.ok);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ [addDailyLog] Error response text:', errorText);
    
    let errorData = {};
    try {
      errorData = JSON.parse(errorText);
      console.error('❌ [addDailyLog] Error response JSON:', errorData);
    } catch (e) {
      console.error('❌ [addDailyLog] Failed to parse error response as JSON:', e);
      errorData = { message: errorText };
    }
    
    console.log('🚀 [addDailyLog] =================== ERROR END');
    throw new Error(errorData.message || 'Failed to add daily log');
  }
  
  const responseData = await res.json();
  console.log('✅ [addDailyLog] Success response:', responseData);
  console.log('🚀 [addDailyLog] =================== SUCCESS END');
  return responseData;
}

// Membership Packages
export async function getMembershipPackages() {
  const res = await fetch(`${API_BASE}/membership-packages`);
  if (!res.ok) throw new Error('Failed to fetch membership packages');
  return res.json();
}

// Suggested Quit Plans (chỉ cho memberVip)
export async function getSuggestedQuitPlans() {
  const res = await fetch(`${API_BASE}/quit-plan/suggested`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (!res.ok) throw new Error('Failed to fetch suggested quit plans');
  return res.json();
} 