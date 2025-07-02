import React, { useEffect, useState } from 'react';
import '../style/NotificationsPage.scss';
import axios from 'axios';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const token = localStorage.getItem('token');
        // Fetch cá nhân
        const res = await axios.get('/api/auth/notifications', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.data;
        let personal = Array.isArray(data) ? data : [];
        // Fetch thông báo chung
        const resPublic = await axios.get('/api/auth/public-notifications');
        const publicData = resPublic.data;
        let publicNoti = [];
        if (publicData.reward) publicNoti = publicNoti.concat(publicData.reward.map(n => ({...n, type: 'reward'})));
        if (publicData.daily) publicNoti = publicNoti.concat(publicData.daily.map(n => ({...n, type: 'daily'})));
        if (publicData.weekly) publicNoti = publicNoti.concat(publicData.weekly.map(n => ({...n, type: 'weekly'})));
        if (publicData.motivation) publicNoti = publicNoti.concat(publicData.motivation.map(n => ({...n, type: 'motivation'})));
        // Gán id cho thông báo chung nếu chưa có
        publicNoti = publicNoti.map((n, idx) => ({...n, id: n.Id || n.id || `public-${n.type}-${idx}`}));
        // Gộp tất cả
        setNotifications([...personal, ...publicNoti]);
      } catch (err) {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  if (loading) return <div className="text-center py-5">Đang tải thông báo...</div>;

  return (
    <div className="notifications-page container py-5">
      <h2 className="mb-4">Thông báo của bạn</h2>
      {notifications.length === 0 ? (
        <div className="alert alert-info">Bạn chưa có thông báo nào.</div>
      ) : (
        <ul className="list-group notifications-list">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`list-group-item d-flex justify-content-between align-items-center notification-item ${n.isRead ? '' : 'fw-bold unread'}`}
            >
              <span>
                {n.message || n.Message || 'Không có nội dung thông báo'}
                {n.type && (
                  <span className="badge bg-light text-dark ms-2">{n.type}</span>
                )}
              </span>
              <span className="badge bg-secondary notification-date">
                {n.createdAt || n.CreatedAt ? new Date(n.createdAt || n.CreatedAt).toLocaleString() : 'Không rõ thời gian'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
