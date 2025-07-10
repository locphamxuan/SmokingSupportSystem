import axios from 'axios';

export async function getMyQuitPlanTemplates() {
  const token = localStorage.getItem('token');
  const res = await axios.get('http://localhost:5000/api/coach/my-quit-plan-templates', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.templates;
}

export async function assignQuitPlanToUser({ userId, templateId, startDate, targetDate }) {
  const token = localStorage.getItem('token');
  const res = await axios.post('http://localhost:5000/api/coach/assign-quit-plan', {
    userId, templateId, startDate, targetDate
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}